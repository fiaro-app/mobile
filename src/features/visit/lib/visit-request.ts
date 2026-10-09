import { z } from 'zod';

/**
 * Cuerpo de `POST /loans/:loanId/collection-visits`. Copia local del contrato del API (D-83): el `id` lo
 * genera el dispositivo y es la llave de idempotencia; `payment` va solo con `PAID` y `promisedDate` solo
 * con `RESCHEDULED`. Se usa también para validar lo que sale de la cola guardada en el teléfono.
 */
export const VisitRequestSchema = z.object({
  id: z.uuid(),
  outcome: z.enum(['PAID', 'NOT_FOUND', 'REFUSED', 'RESCHEDULED']),
  occurredAt: z.string(),
  promisedDate: z.string().nullable().optional(),
  payment: z.object({ amount: z.number().int().positive(), method: z.enum(['CASH', 'NEQUI', 'TRANSFER']) }).nullable().optional(),
});
export type VisitRequest = z.infer<typeof VisitRequestSchema>;

/** Resultado de visita que se registra sin dinero. */
export type NoPaymentOutcome = 'NOT_FOUND' | 'REFUSED';

/** Medio de pago. */
export type Method = 'CASH' | 'NEQUI' | 'TRANSFER';

/**
 * Visita con pago. `occurredAt` es la hora REAL de la visita según el teléfono, no la de envío: una visita
 * hecha sin conexión llega horas después, y el API valida la asignación del día en que ocurrió.
 */
export function paidVisit(id: string, amount: number, method: Method, now: Date = new Date()): VisitRequest {
  return { id, outcome: 'PAID', occurredAt: now.toISOString(), payment: { amount, method } };
}

/** Visita sin pago (`NOT_FOUND` o `REFUSED`). */
export function unpaidVisit(id: string, outcome: NoPaymentOutcome, now: Date = new Date()): VisitRequest {
  return { id, outcome, occurredAt: now.toISOString() };
}

/** Visita reprogramada: exige la fecha de compromiso (`promisedDate`), lo que el API valida. */
export function rescheduledVisit(id: string, promisedDate: string, now: Date = new Date()): VisitRequest {
  return { id, outcome: 'RESCHEDULED', occurredAt: now.toISOString(), promisedDate };
}
