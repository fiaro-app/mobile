import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { useClientQuery } from '@/features/clients/hooks/use-client-query';
import { assignCollector, cancelLoan } from '@/features/loans/api/loans-api';
import { LOANS_COPY, loanFailureMessage } from '@/features/loans/content/messages';
import { useAssignmentsQuery, useLoanBalanceQuery, useLoanQuery } from '@/features/loans/hooks/use-loan-queries';
import { currentAssignment, paidInstallments, paidPercent } from '@/features/loans/lib/loan-calculations';
import { installmentLabel, loanBadge } from '@/features/loans/lib/loan-view-model';
import { useMembers } from '@/features/team/hooks/use-members';
import { businessDateOf, formatShortDate } from '@/lib/business-date';
import { failureOf } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import { formatCop } from '@/lib/format-cop';
import type { Result } from '@/lib/result';
import type { BadgeKind } from '@/components/atoms/Badge';

/** Diálogo u hoja abierta sobre la pantalla. */
export type LoanDialog = 'none' | 'cancel' | 'assign';

/** Todo lo que el detalle de un préstamo dibuja y puede hacer. */
export interface LoanDetail {
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly loadFailed: boolean;
  readonly model: {
    readonly clientId: string;
    readonly clientName: string;
    readonly badge: { readonly label: string; readonly kind: BadgeKind };
    readonly balance: string;
    readonly percent: number;
    readonly progress: string;
    readonly rows: readonly { readonly label: string; readonly value: string; readonly alert?: boolean }[];
    readonly collectorName: string | null;
    readonly canCancel: boolean;
    readonly cancelMessage: string;
  } | null;
  readonly collectorOptions: readonly { value: string; label: string }[];
  readonly dialog: LoanDialog;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly openDialog: (dialog: Exclude<LoanDialog, 'none'>) => void;
  readonly closeDialog: () => void;
  readonly assign: (membershipId: string) => void;
  readonly confirmCancel: () => void;
  readonly refresh: () => void;
}

/**
 * Lógica del detalle de un préstamo: datos, saldo, progreso, cobrador asignado, y las acciones de asignar cobrador y anular
 * (solo con el préstamo vigente). Tras cada acción se refrescan las consultas del préstamo y las listas, para que coincidan.
 */
export function useLoanDetail(id: string): LoanDetail {
  const queryClient = useQueryClient();
  const loan = useLoanQuery(id);
  const balance = useLoanBalanceQuery(id);
  const assignments = useAssignmentsQuery(id);
  const members = useMembers();
  const client = useClientQuery(loan.data?.clientId);
  const [dialog, setDialog] = useState<LoanDialog>('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const collectors = useMemo(() => (members.data ?? []).filter((member) => member.status === 'ACTIVE' && member.roles.includes('COLLECTOR')), [members.data]);
  const failure = failureOf(loan.error);

  const run = async (action: () => Promise<Result<unknown, ApiFailure>>, success: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await action();
    setBusy(false);
    setDialog('none');
    if (!result.ok) {
      signOutIfSessionExpired(result.failure);
      setError(loanFailureMessage(result.failure));
      return;
    }
    setNotice(success);
    void queryClient.invalidateQueries({ queryKey: ['admin', 'loan', id] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'loan-balance', id] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'loan-assignments', id] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'loans'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'client-loans'] });
  };

  let model: LoanDetail['model'] = null;
  const data = loan.data;
  if (data && balance.data) {
    const current = currentAssignment(assignments.data ?? [], businessDateOf());
    const collectorName = current ? (members.data?.find((member) => member.id === current.collectorMembershipId)?.fullName ?? 'Cobrador') : null;
    const clientName = client.data?.fullName ?? 'Cliente';
    const paid = paidInstallments(data.totalPayable, balance.data.balance, data.installmentValue, data.installmentCount);
    const rows = [
      { label: LOANS_COPY.detail.installment, value: installmentLabel({ installmentValue: data.installmentValue, frequency: data.frequency }) },
      { label: LOANS_COPY.detail.start, value: formatShortDate(data.startDate) },
      ...(balance.data.overdueAmount > 0 ? [{ label: LOANS_COPY.detail.overdue, value: `${formatCop(balance.data.overdueAmount)} · ${String(balance.data.overdueDays)} ${balance.data.overdueDays === 1 ? 'día' : 'días'}`, alert: true }] : []),
    ];
    model = {
      clientId: data.clientId,
      clientName,
      badge: loanBadge({ status: data.status, balance: balance.data.balance, overdueDays: balance.data.overdueDays }),
      balance: formatCop(balance.data.balance),
      percent: paidPercent(data.totalPayable, balance.data.balance),
      progress: `${String(paidPercent(data.totalPayable, balance.data.balance))} % pagado · ${String(paid)} de ${String(data.installmentCount)} cuotas`,
      rows,
      collectorName,
      canCancel: data.status === 'ACTIVE',
      cancelMessage: LOANS_COPY.detail.cancelMessage(clientName, formatCop(data.principalAmount)),
    };
  }

  return {
    loading: loan.isPending || (loan.data !== undefined && balance.isPending),
    notFound: failure?.kind === 'http' && failure.status === 404,
    loadFailed: model === null && !loan.isPending && !(failure?.kind === 'http' && failure.status === 404),
    model,
    collectorOptions: collectors.map((member) => ({ value: member.id, label: member.fullName })),
    dialog,
    busy,
    error,
    notice,
    openDialog: setDialog,
    closeDialog: () => {
      setDialog('none');
    },
    assign: (membershipId) => {
      void run(() => assignCollector(id, membershipId), LOANS_COPY.detail.assigned);
    },
    confirmCancel: () => {
      void run(() => cancelLoan(id), LOANS_COPY.detail.canceled);
    },
    refresh: () => {
      void loan.refetch();
      void balance.refetch();
      void assignments.refetch();
    },
  };
}
