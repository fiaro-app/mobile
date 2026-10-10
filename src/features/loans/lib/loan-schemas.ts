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
