import { useMemo } from 'react';
import { useInstallmentsQuery } from '@/features/loans/hooks/use-loan-queries';
import { summarizeInstallments, toInstallmentRows, type InstallmentRowModel } from '@/features/loans/lib/installments-view-model';

/** Todo lo que el calendario de cuotas dibuja. */
export interface LoanCalendar {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly summary: string;
  readonly rows: InstallmentRowModel[];
  readonly refresh: () => void;
}

/** Lógica del calendario de cuotas de un préstamo (calculado por el API con el mismo motor que el saldo y la mora). */
export function useLoanCalendar(id: string): LoanCalendar {
  const query = useInstallmentsQuery(id);
  const rows = useMemo(() => toInstallmentRows(query.data ?? []), [query.data]);
  return {
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    refreshing: query.isRefetching,
    summary: summarizeInstallments(query.data ?? []),
    rows,
    refresh: () => {
      void query.refetch();
    },
  };
}
