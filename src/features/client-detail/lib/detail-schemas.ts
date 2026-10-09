import { z } from 'zod';

/**
 * Copias locales de lo que el API entrega para el detalle de un cliente (`GET /clients/:id`,
 * `GET /loans/:id`, `GET /loans/:id/balance`, `GET /loans/:id/collection-visits`). Solo los campos que la
 * pantalla usa; cuando se instale `@fiaro-app/contracts` (M-11) se reemplazan por sus schemas.
 */
export const ClientSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  occupation: z.string(),
  phone: z.string(),
  address: z.string(),
});
export type Client = z.infer<typeof ClientSchema>;

export const LoanFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']);
export type LoanFrequency = z.infer<typeof LoanFrequencySchema>;

export const LoanSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  installmentValue: z.number().int(),
  frequency: LoanFrequencySchema,
  status: z.enum(['ACTIVE', 'PAID_OFF', 'CANCELED']),
});
export type Loan = z.infer<typeof LoanSchema>;

export const BalanceSchema = z.object({
  loanId: z.string(),
  balance: z.number().int(),
  overdueAmount: z.number().int(),
  overdueDays: z.number().int(),
  nextDueDate: z.string().nullable(),
});
export type Balance = z.infer<typeof BalanceSchema>;

export const PaymentMethodSchema = z.enum(['CASH', 'NEQUI', 'TRANSFER']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const VisitOutcomeSchema = z.enum(['PAID', 'NOT_FOUND', 'REFUSED', 'RESCHEDULED']);
export type VisitOutcome = z.infer<typeof VisitOutcomeSchema>;

export const VisitSchema = z.object({
  id: z.string(),
  outcome: VisitOutcomeSchema,
  promisedDate: z.string().nullable(),
  occurredAt: z.string(),
  payment: z
    .object({
      amount: z.number().int(),
      method: PaymentMethodSchema,
      reversal: z.unknown().nullable(),
    })
    .nullable(),
});
export type Visit = z.infer<typeof VisitSchema>;
export const VisitsSchema = z.array(VisitSchema);
