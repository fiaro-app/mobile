import { useState } from 'react';
import { createPortfolio, deletePortfolio, renamePortfolio } from '@/features/settings/api/settings-api';
import { portfolioDeleteFailureMessage, SETTINGS_COPY, settingsFailureMessage } from '@/features/settings/content/messages';
import type { Portfolio } from '@/features/settings/lib/settings-schemas';
import { useSaveAction } from '@/lib/hooks/use-save-action';

/** Qué se está haciendo con las carteras: nada, creando, renombrando una o confirmando borrar una. */
export type PortfolioMode = { readonly kind: 'none' } | { readonly kind: 'create' } | { readonly kind: 'rename'; readonly id: string } | { readonly kind: 'delete'; readonly id: string };

/** Sección "Carteras". */
export interface PortfolioManager {
  readonly mode: PortfolioMode;
  readonly name: string;
  readonly nameError: string | null;
  readonly error: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly deleting: Portfolio | null;
  readonly startCreate: () => void;
  readonly startRename: (portfolio: Portfolio) => void;
  readonly startDelete: (portfolio: Portfolio) => void;
  readonly cancel: () => void;
  readonly setName: (text: string) => void;
  readonly submitName: () => void;
  readonly confirmDelete: () => void;
}

/**
 * Crear, renombrar y borrar carteras. El nombre es obligatorio y no puede repetirse (el API responde `CONFLICT`); la cartera por
 * defecto se puede renombrar pero no borrar, y una con cobradores activos tampoco (también `CONFLICT`, con su propio mensaje).
 * Tras cada cambio se refresca la lista que usan el registro de cobradores y la lista de cobradores.
 */
export function usePortfolioManager(portfolios: readonly Portfolio[]): PortfolioManager {
  const [mode, setMode] = useState<PortfolioMode>({ kind: 'none' });
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const action = useSaveAction(settingsFailureMessage);
  const deleteAction = useSaveAction(portfolioDeleteFailureMessage);
  const keys = [['portfolios']] as const;

  const close = () => {
    setMode({ kind: 'none' });
    setName('');
    setNameError(null);
  };
  const deleting = mode.kind === 'delete' ? (portfolios.find((portfolio) => portfolio.id === mode.id) ?? null) : null;

  return {
    mode,
    name,
    nameError,
    error: action.error ?? deleteAction.error,
    notice: action.notice ?? deleteAction.notice,
    busy: action.busy || deleteAction.busy,
    deleting,
    startCreate: () => {
      action.clear();
      deleteAction.clear();
      setMode({ kind: 'create' });
    },
    startRename: (portfolio) => {
      action.clear();
      deleteAction.clear();
      setName(portfolio.name);
      setMode({ kind: 'rename', id: portfolio.id });
    },
    startDelete: (portfolio) => {
      action.clear();
      deleteAction.clear();
      setMode({ kind: 'delete', id: portfolio.id });
    },
    cancel: close,
    setName: (text) => {
      setName(text);
      setNameError(null);
    },
    submitName: () => {
      const trimmed = name.trim();
      if (trimmed === '' || trimmed.length > 120) {
        setNameError(SETTINGS_COPY.portfolios.nameRequired);
        return;
      }
      const current = mode;
      void (async () => {
        const done =
          current.kind === 'rename'
            ? await action.run(() => renamePortfolio(current.id, trimmed), SETTINGS_COPY.portfolios.renamed, keys)
            : await action.run(() => createPortfolio(trimmed), SETTINGS_COPY.portfolios.created, keys);
        if (done) close();
      })();
    },
    confirmDelete: () => {
      if (mode.kind !== 'delete') return;
      const { id } = mode;
      void deleteAction.run(() => deletePortfolio(id), SETTINGS_COPY.portfolios.deleted, keys).finally(() => {
        setMode({ kind: 'none' });
      });
    },
  };
}
