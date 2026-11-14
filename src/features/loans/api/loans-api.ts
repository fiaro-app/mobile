import { z } from 'zod';
import {
  AssignmentSchema,
  InstallmentsSchema,
  LoanBalanceSchema,
  LoanSchema,
  LoansPageSchema,
  LoanVisitSchema,
  type Assignment,
  type Installment,
  type Loan,
  type LoanBalance,
  type LoanListItem,
  type LoanStatus,
  type LoanVisit,
} from '@/features/loans/lib/loan-schemas';
import { businessDateOf } from '@/lib/business-date';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** Préstamos por página. */
export const LOANS_PAGE_SIZE = 10;

/** Una página de préstamos con su total. */
export interface LoansPage {
  readonly items: LoanListItem[];
  readonly total: number;
}

/** `QUERY /loans`: página de préstamos con saldo y mora; `status` filtra en el API. */
export function fetchLoans(page: number, status?: LoanStatus): Response<LoansPage> {
  return authedRequest(
    '/loans',
    (body) => {
      const parsed = LoansPageSchema.parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    { method: 'QUERY', body: { page, pageSize: LOANS_PAGE_SIZE, ...(status ? { status } : {}) } },
  );
}

/** `GET /loans/:id`. */
export function fetchLoan(id: string): Response<Loan> {
  return authedRequest(`/loans/${id}`, (body) => LoanSchema.parse(body));
}

/** `GET /loans/:id/balance`: saldo, mora y próxima cuota al día de hoy. */
export function fetchLoanBalance(id: string): Response<LoanBalance> {
  return authedRequest(`/loans/${id}/balance`, (body) => LoanBalanceSchema.parse(body));
}

/** `GET /loans/:id/installments`: calendario de cuotas con lo pagado y el estado de cada una. */
export function fetchInstallments(id: string): Response<Installment[]> {
  return authedRequest(`/loans/${id}/installments`, (body) => InstallmentsSchema.parse(body).installments);
}

/** `GET /loans/:id/collection-assignments`: historial de cobradores asignados. */
export function fetchAssignments(id: string): Response<Assignment[]> {
  return authedRequest(`/loans/${id}/collection-assignments`, (body) => z.array(AssignmentSchema).parse(body));
}

/** `POST /loans/:id/collection-assignments`: asigna un cobrador desde hoy (la asignación anterior deja de regir). */
export function assignCollector(loanId: string, collectorMembershipId: string): Response<Assignment> {
  return authedRequest(`/loans/${loanId}/collection-assignments`, (body) => AssignmentSchema.parse(body), {
    method: 'POST',
    body: { collectorMembershipId, effectiveFrom: businessDateOf() },
  });
}

/** Cuerpo de `POST /loans`. */
export interface CreateLoanBody {
  readonly clientId: string;
  readonly principalAmount: number;
  readonly installmentCount: number;
  readonly installmentValue: number;
  readonly totalPayable: number;
  readonly frequency: string;
  readonly startDate: string;
}

/** `POST /loans`: da de alta un préstamo (solo Owner y Lender). */
export function createLoan(body: CreateLoanBody): Response<Loan> {
  return authedRequest('/loans', (response) => LoanSchema.parse(response), { method: 'POST', body });
}

/** `POST /loans/:id/cancel`: anula un préstamo vigente (error de registro, antes de recibir pagos). */
export function cancelLoan(id: string): Response<Loan> {
  return authedRequest(`/loans/${id}/cancel`, (body) => LoanSchema.parse(body), { method: 'POST', body: {} });
}

/** `GET /loans/:id/collection-visits`: visitas con su pago y su reversión. */
export function fetchLoanVisits(id: string): Response<LoanVisit[]> {
  return authedRequest(`/loans/${id}/collection-visits`, (body) => z.array(LoanVisitSchema).parse(body));
}

/** `POST /payments/:id/reversals`: anula un pago con un motivo (solo quien administra). */
export function reversePayment(paymentId: string, reason: string): Response<unknown> {
  return authedRequest(`/payments/${paymentId}/reversals`, (body) => body, { method: 'POST', body: { reason } });
}
