import { useMemo, useState } from 'react';
import { fetchSessions, revokeOtherSessions, revokeSession } from '@/features/account/api/account-api';
import { accountFailureMessage } from '@/features/account/content/messages';
import { toSessionRows, type SessionRowModel } from '@/features/account/lib/session-schemas';
import { useApiQuery } from '@/lib/hooks/use-api-query';
import { useSaveAction } from '@/lib/hooks/use-save-action';

const KEY = ['account', 'sessions'] as const;

/** Qué se confirma en el diálogo. */
export type SessionsDialog = { readonly kind: 'none' } | { readonly kind: 'one'; readonly id: string; readonly device: string } | { readonly kind: 'others' };

/** Todo lo que "Sesiones abiertas" dibuja y puede hacer. */
export interface Sessions {
  readonly rows: SessionRowModel[];
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly hasOthers: boolean;
  readonly dialog: SessionsDialog;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly askOne: (row: SessionRowModel) => void;
  readonly askOthers: () => void;
  readonly cancel: () => void;
  readonly confirm: () => void;
  readonly refresh: () => void;
}

/**
 * Lógica de "Sesiones abiertas": ver dónde está abierta la cuenta, cerrar una sesión puntual o todas las demás. La sesión de
 * ESTE teléfono no se puede cerrar desde aquí (el API responde 409): para salir está "Cerrar sesión" en el Perfil.
 */
export function useSessions(): Sessions {
  const query = useApiQuery(KEY, fetchSessions);
  const action = useSaveAction(accountFailureMessage);
  const [dialog, setDialog] = useState<SessionsDialog>({ kind: 'none' });
  const rows = useMemo(() => toSessionRows(query.data ?? []), [query.data]);
  return {
    rows,
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    refreshing: query.isRefetching,
    hasOthers: rows.some((row) => !row.isCurrent),
    dialog,
    busy: action.busy,
    error: action.error,
    notice: action.notice,
    askOne: (row) => {
      action.clear();
      setDialog({ kind: 'one', id: row.id, device: row.device });
    },
    askOthers: () => {
      action.clear();
      setDialog({ kind: 'others' });
    },
    cancel: () => {
      setDialog({ kind: 'none' });
    },
    confirm: () => {
      const current = dialog;
      if (current.kind === 'none') return;
      void action
        .run(() => (current.kind === 'one' ? revokeSession(current.id) : revokeOtherSessions()), current.kind === 'one' ? 'Sesión cerrada.' : 'Se cerraron las demás sesiones.', [KEY])
        .finally(() => {
          setDialog({ kind: 'none' });
        });
    },
    refresh: () => {
      void query.refetch();
    },
  };
}
