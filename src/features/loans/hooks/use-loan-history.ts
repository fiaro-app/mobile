import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { reversePayment } from '@/features/loans/api/loans-api';
import { LOANS_COPY, loanFailureMessage } from '@/features/loans/content/messages';
import { useLoanVisitsQuery } from '@/features/loans/hooks/use-loan-queries';
import { toVisitRow, type VisitRowModel } from '@/features/loans/lib/visit-history-view-model';
import { useMembers } from '@/features/team/hooks/use-members';

/** Todo lo que el historial de cobros dibuja y puede hacer. */
export interface LoanHistory {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly rows: VisitRowModel[];
  /** Pago que se está por revertir (abre el diálogo), o `null`. */
  readonly reversing: { readonly paymentId: string; readonly amount: string } | null;
  readonly reason: string;
  readonly reasonError: string | null;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly startReverse: (row: VisitRowModel) => void;
  readonly setReason: (text: string) => void;
  readonly cancelReverse: () => void;
  readonly confirmReverse: () => void;
  readonly refresh: () => void;
}

/**
 * Lógica del historial de cobros de un préstamo y de la reversión de pagos (solo quien administra). Revertir exige un
 * motivo; un pago ya revertido no ofrece la acción. Al revertir sube el saldo, así que se refrescan también el saldo,
 * el calendario y las listas.
 */
export function useLoanHistory(loanId: string): LoanHistory {
  const queryClient = useQueryClient();
  const query = useLoanVisitsQuery(loanId);
  const members = useMembers();
  const [target, setTarget] = useState<{ paymentId: string; amount: string } | null>(null);
  const [reason, setReasonState] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const names = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.fullName])), [members.data]);
  const rows = useMemo(() => (query.data ?? []).toSorted((a, b) => b.occurredAt.localeCompare(a.occurredAt)).map((visit) => toVisitRow(visit, names)), [query.data, names]);

  const close = () => {
    setTarget(null);
    setReasonState('');
    setReasonError(null);
  };

  return {
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    refreshing: query.isRefetching,
    rows,
    reversing: target,
    reason,
    reasonError,
    busy,
    error,
    notice,
    startReverse: (row) => {
      if (row.reversiblePaymentId === null) return;
      setNotice(null);
      setError(null);
      setTarget({ paymentId: row.reversiblePaymentId, amount: row.trailing });
    },
    setReason: (text) => {
      setReasonState(text);
      setReasonError(null);
    },
    cancelReverse: close,
    confirmReverse: () => {
      const motive = reason.trim();
      if (!target) return;
      if (motive === '') {
        setReasonError(LOANS_COPY.history.reasonRequired);
        return;
      }
      void (async () => {
        setBusy(true);
        const result = await reversePayment(target.paymentId, motive);
        setBusy(false);
        close();
        if (!result.ok) {
          signOutIfSessionExpired(result.failure);
          setError(loanFailureMessage(result.failure));
          return;
        }
        setNotice(LOANS_COPY.history.reversed);
        for (const key of ['loan-visits', 'loan-balance', 'loan-installments']) void queryClient.invalidateQueries({ queryKey: ['admin', key, loanId] });
        void queryClient.invalidateQueries({ queryKey: ['admin', 'loans'] });
        void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      })();
    },
    refresh: () => {
      void query.refetch();
    },
  };
}
