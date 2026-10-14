import { z } from 'zod';

/** Cada cuánto se cobra una cuota. */
export const FrequencySchema = z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']);
export type Frequency = z.infer<typeof FrequencySchema>;

/** Estado del préstamo: vigente, pagado por completo o anulado. */
export const LoanStatusSchema = z.enum(['ACTIVE', 'PAID_OFF', 'CANCELED']);
export type LoanStatus = z.infer<typeof LoanStatusSchema>;

/** Préstamo tal como lo devuelve `GET /loans/:id`. */
export const LoanSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  principalAmount: z.int(),
  installmentCount: z.int(),
  installmentValue: z.int(),
  totalPayable: z.int(),
  frequency: FrequencySchema,
  startDate: z.string(),
  status: LoanStatusSchema,
  closedAt: z.string().nullable(),
});
export type Loan = z.infer<typeof LoanSchema>;

/** Fila de `QUERY /loans`: el préstamo más su saldo y mora, calculados por el motor de calendario del API. */
export const LoanListItemSchema = LoanSchema.extend({
  balance: z.int(),
  overdueAmount: z.int(),
  overdueDays: z.int(),
  nextDueDate: z.string().nullable(),
  collector: z.object({ membershipId: z.string(), fullName: z.string() }).nullable().optional(),
});
export type LoanListItem = z.infer<typeof LoanListItemSchema>;

/** Página de préstamos. */
export const LoansPageSchema = z.object({ data: z.array(LoanListItemSchema), meta: z.object({ total: z.number() }) });

/** Saldo, mora y próxima cuota (`GET /loans/:id/balance`), calculados por el motor de calendario del API. */
export const LoanBalanceSchema = z.object({
  loanId: z.string(),
  balance: z.int(),
  totalExpectedToDate: z.int(),
  overdueAmount: z.int(),
  overdueDays: z.int(),
  nextDueDate: z.string().nullable(),
  firstOverdueDate: z.string().nullable(),
});
export type LoanBalance = z.infer<typeof LoanBalanceSchema>;

/** Estado de una cuota del calendario: pagada, parcial, vencida o pendiente. */
export const InstallmentStatusSchema = z.enum(['PAID', 'PARTIAL', 'OVERDUE', 'PENDING']);
export type InstallmentStatus = z.infer<typeof InstallmentStatusSchema>;

/** Una cuota del calendario. */
export const InstallmentSchema = z.object({
  number: z.int(),
  dueDate: z.string(),
  expectedAmount: z.int(),
  paidAmount: z.int(),
  status: InstallmentStatusSchema,
});
export type Installment = z.infer<typeof InstallmentSchema>;

/** `GET /loans/:id/installments`. */
export const InstallmentsSchema = z.object({ loanId: z.string(), asOf: z.string(), installments: z.array(InstallmentSchema) });

/** Asignación de un cobrador a un préstamo (con vigencia). */
export const AssignmentSchema = z.object({
  id: z.string(),
  loanId: z.string(),
  collectorMembershipId: z.string(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

/** Visita de cobro de un préstamo, con su pago y la reversión del pago si la hubo (`GET /loans/:id/collection-visits`). */
export const LoanVisitSchema = z.object({
  id: z.string(),
  collectorMembershipId: z.string(),
  outcome: z.enum(['PAID', 'NOT_FOUND', 'REFUSED', 'RESCHEDULED']),
  promisedDate: z.string().nullable(),
  occurredAt: z.string(),
  payment: z
    .object({
      id: z.string(),
      amount: z.int(),
      method: z.enum(['CASH', 'NEQUI', 'TRANSFER']),
      reversal: z.object({ reason: z.string() }).nullable(),
    })
    .nullable(),
});
export type LoanVisit = z.infer<typeof LoanVisitSchema>;
