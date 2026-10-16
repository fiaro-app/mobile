import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { changeRoles, deactivateMember } from '@/features/admins/api/admins-api';
import { ADMINS_COPY, adminFailureMessage } from '@/features/admins/content/messages';
import { toAdminRows, toPromotable, type AdminAction, type AdminRowModel, type PromotableModel } from '@/features/admins/lib/admin-view-model';
import { useMembers } from '@/features/team/hooks/use-members';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import { failureOf } from '@/lib/http/api-failure-error';

/** Lo que se confirma: subir de rango, quitar el rol o quitar el acceso, y a quién. */
export interface PendingChange {
  readonly kind: 'promote' | AdminAction;
  readonly id: string;
  readonly name: string;
  readonly roles: readonly string[];
}

/** Todo lo que la lista de administradores dibuja y puede hacer. */
export interface AdminsScreen {
  readonly rows: AdminRowModel[];
  readonly promotable: PromotableModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly failed: boolean;
  readonly forbidden: boolean;
  readonly sheetOpen: boolean;
  readonly pending: PendingChange | null;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly openSheet: () => void;
  readonly closeSheet: () => void;
  readonly choosePromotion: (membershipId: string) => void;
  readonly chooseAction: (row: AdminRowModel) => void;
  readonly cancel: () => void;
  readonly confirm: () => void;
  readonly refresh: () => void;
}

/**
 * Lógica de la lista de administradores: quiénes son, subir de rango a un colaborador (suma el rol `LENDER` a los que ya
 * tenía), quitar el rol (sigue con el otro) o quitar el acceso (solo administraba). Cada cambio se confirma antes y refresca
 * los colaboradores. La API tampoco deja actuar sobre el dueño ni sobre uno mismo.
 */
export function useAdminsScreen(): AdminsScreen {
  const queryClient = useQueryClient();
  const members = useMembers();
  const selfId = useWorkspaceStore((state) => state.membershipId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const failure = failureOf(members.error);
  const rows = useMemo(() => toAdminRows(members.data ?? [], selfId), [members.data, selfId]);
  const promotable = useMemo(() => toPromotable(members.data ?? []), [members.data]);

  return {
    rows,
    promotable,
    loading: members.isPending,
    refreshing: members.isRefetching,
    failed: members.data === undefined && members.isError && !(failure?.kind === 'http' && failure.status === 403),
    forbidden: failure?.kind === 'http' && failure.status === 403,
    sheetOpen,
    pending,
    busy,
    error,
    notice,
    openSheet: () => {
      setSheetOpen(true);
    },
    closeSheet: () => {
      setSheetOpen(false);
    },
    choosePromotion: (membershipId) => {
      const option = promotable.find((candidate) => candidate.value === membershipId);
      setSheetOpen(false);
      if (!option) return;
      setError(null);
      setNotice(null);
      setPending({ kind: 'promote', id: option.value, name: option.label, roles: option.roles });
    },
    chooseAction: (row) => {
      if (!row.action) return;
      setError(null);
      setNotice(null);
      setPending({ kind: row.action, id: row.id, name: row.name, roles: row.roles });
    },
    cancel: () => {
      setPending(null);
    },
    confirm: () => {
      if (!pending) return;
      const change = pending;
      void (async () => {
        setBusy(true);
        let result;
        if (change.kind === 'remove') result = await deactivateMember(change.id);
        else if (change.kind === 'demote') result = await changeRoles(change.id, change.roles.filter((role) => role !== 'LENDER'));
        else result = await changeRoles(change.id, [...new Set([...change.roles, 'LENDER'])]);
        setBusy(false);
        setPending(null);
        if (!result.ok) {
          signOutIfSessionExpired(result.failure);
          setError(adminFailureMessage(result.failure));
          return;
        }
        setNotice(ADMINS_COPY.notices[change.kind](change.name));
        void queryClient.invalidateQueries({ queryKey: ['members'] });
      })();
    },
    refresh: () => {
      void members.refetch();
    },
  };
}
