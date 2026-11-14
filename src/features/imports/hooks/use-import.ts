import { useCallback, useState } from 'react';
import { IMPORTS_COPY } from '@/features/imports/content/messages';
import { pickAndReadCells } from '@/features/imports/lib/read-cells';
import { parseSheet, type ParsedRow } from '@/features/imports/lib/parse-sheet';
import { ImportSendError, sendImport, type ImportItem } from '@/features/imports/lib/send-import';
import type { ApiFailure } from '@/lib/http/failure';

export type ImportState =
  | { readonly phase: 'idle'; readonly error: string | null }
  | { readonly phase: 'working'; readonly step: 'reading' | 'reviewing' | 'importing' }
  | { readonly phase: 'review'; readonly parsed: readonly ParsedRow[]; readonly items: readonly ImportItem[] }
  | { readonly phase: 'done'; readonly items: readonly ImportItem[] };

const IDLE: ImportState = { phase: 'idle', error: null };
const DENIED_CODES = new Set(['FORBIDDEN', 'PLAN_FEATURE_UNAVAILABLE', 'SUBSCRIPTION_READ_ONLY']);

/** El mensaje de un fallo de la API: plan o rol que no permite importar, o falta de conexión. */
function describeFailure(failure: ApiFailure): string {
  return failure.kind === 'http' && failure.code !== null && DENIED_CODES.has(failure.code) ? IMPORTS_COPY.sheetErrors.forbidden : IMPORTS_COPY.sheetErrors.network;
}

/** El error a mostrar al volver al inicio, sea de la API o inesperado. */
const describeError = (error: unknown) => (error instanceof ImportSendError ? describeFailure(error.failure) : IMPORTS_COPY.sheetErrors.network);

/**
 * Lógica de «Importar», sin diseño: elige y lee el archivo, lo revisa con la API (`dryRun`) y, solo cuando la persona
 * confirma, lo crea. Cada paso deja el estado listo para pintar; un error vuelve al inicio con su mensaje.
 */
export function useImport() {
  const [state, setState] = useState<ImportState>(IDLE);

  const choose = useCallback(async () => {
    const errors = IMPORTS_COPY.sheetErrors;
    setState({ phase: 'working', step: 'reading' });
    let parsedSheet;
    try {
      const picked = await pickAndReadCells();
      if (picked.kind === 'cancelled') return setState(IDLE);
      if (picked.kind === 'format') return setState({ phase: 'idle', error: errors.format });
      parsedSheet = parseSheet(picked.cells);
    } catch {
      return setState({ phase: 'idle', error: errors.unreadable });
    }
    if (parsedSheet.kind === 'empty') return setState({ phase: 'idle', error: errors.empty });
    if (parsedSheet.kind === 'too-many') return setState({ phase: 'idle', error: errors.tooMany });
    if (parsedSheet.kind === 'missing-columns') return setState({ phase: 'idle', error: errors.missing(parsedSheet.missing) });
    setState({ phase: 'working', step: 'reviewing' });
    try {
      setState({ phase: 'review', parsed: parsedSheet.rows, items: await sendImport(parsedSheet.rows, true, describeFailure) });
    } catch (error) {
      setState({ phase: 'idle', error: describeError(error) });
    }
  }, []);

  const confirm = useCallback(async () => {
    if (state.phase !== 'review') return;
    setState({ phase: 'working', step: 'importing' });
    try {
      setState({ phase: 'done', items: await sendImport(state.parsed, false, describeFailure) });
    } catch (error) {
      setState({ phase: 'idle', error: describeError(error) });
    }
  }, [state]);

  const reset = useCallback(() => {
    setState(IDLE);
  }, []);

  return { state, choose, confirm, reset };
}
