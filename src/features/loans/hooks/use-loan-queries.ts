import { fetchAssignments, fetchInstallments, fetchLoan, fetchLoanBalance, fetchLoanVisits } from '@/features/loans/api/loans-api';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/** Un préstamo por `id`. */
export const useLoanQuery = (id: string) => useApiQuery(['admin', 'loan', id], () => fetchLoan(id));

/** Saldo, mora y próxima cuota del préstamo. */
export const useLoanBalanceQuery = (id: string) => useApiQuery(['admin', 'loan-balance', id], () => fetchLoanBalance(id));

/** Historial de cobradores asignados. */
export const useAssignmentsQuery = (id: string) => useApiQuery(['admin', 'loan-assignments', id], () => fetchAssignments(id));

/** Calendario de cuotas. */
export const useInstallmentsQuery = (id: string) => useApiQuery(['admin', 'loan-installments', id], () => fetchInstallments(id));

/** Visitas de cobro del préstamo. */
export const useLoanVisitsQuery = (id: string) => useApiQuery(['admin', 'loan-visits', id], () => fetchLoanVisits(id));
