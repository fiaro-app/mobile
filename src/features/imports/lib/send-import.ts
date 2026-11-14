import { runImport } from '@/features/imports/api/imports-api';
import { IMPORT_CHUNK_SIZE, type ImportResponse, type ImportRow, type ImportRowStatus } from '@/features/imports/lib/import-schemas';
import type { ParsedRow } from '@/features/imports/lib/parse-sheet';
import type { ApiFailure } from '@/lib/http/failure';

/** Lo que pasó con una fila de la hoja. */
export interface ImportItem {
  readonly sheetRow: number;
  readonly status: ImportRowStatus;
  readonly problems: readonly string[];
}

/** Por qué no se pudo mandar: la API negó el plan o el rol, o no hubo cómo hablar con ella. */
export class ImportSendError extends Error {
  constructor(readonly failure: ApiFailure) {
    super('import-send-failed');
  }
}

/** Las filas que la API no ve: las que ya traen problemas de la hoja. */
function localInvalid(parsed: readonly ParsedRow[]): ImportItem[] {
  return parsed.filter((entry) => entry.row === null).map((entry) => ({ sheetRow: entry.sheetRow, status: 'INVALID', problems: entry.problems }));
}

/** Lo que la API contestó de una tanda, con el número de fila de la hoja de cada resultado. */
function itemsOf(chunk: readonly ParsedRow[], response: ImportResponse): ImportItem[] {
  return response.rows.flatMap((result) => {
    const sheetRow = chunk[result.row - 1]?.sheetRow;
    return sheetRow === undefined ? [] : [{ sheetRow, status: result.status, problems: result.issues.map((issue) => issue.message) }];
  });
}

/**
 * Manda las filas que se pueden mandar, en tandas, y las junta con las que ya venían con problemas.
 * Si una tanda falla después de que otras ya se crearon, las que faltan quedan como fallidas en vez de
 * perder lo hecho (volver a confirmar duplicaría los préstamos ya creados). Lanza `ImportSendError` si falla
 * la revisión o la primera tanda.
 *
 * @param parsed - Las filas leídas de la hoja.
 * @param dryRun - `true` solo revisa; `false` crea.
 * @param failureMessage - Texto que se anota en las filas que quedan sin mandar cuando una tanda posterior falla.
 */
export async function sendImport(parsed: readonly ParsedRow[], dryRun: boolean, failureMessage: (failure: ApiFailure) => string): Promise<readonly ImportItem[]> {
  const sendable = parsed.filter((entry): entry is ParsedRow & { row: ImportRow } => entry.row !== null);
  const items = localInvalid(parsed);
  for (let offset = 0; offset < sendable.length; offset += IMPORT_CHUNK_SIZE) {
    const chunk = sendable.slice(offset, offset + IMPORT_CHUNK_SIZE);
    const result = await runImport(chunk.map((entry) => entry.row), dryRun);
    if (result.ok) {
      items.push(...itemsOf(chunk, result.value));
      continue;
    }
    if (dryRun || offset === 0) throw new ImportSendError(result.failure);
    const problems = [failureMessage(result.failure)];
    items.push(...sendable.slice(offset).map((entry): ImportItem => ({ sheetRow: entry.sheetRow, status: 'FAILED', problems })));
    break;
  }
  return items.sort((a, b) => a.sheetRow - b.sheetRow);
}
