import { z } from 'zod';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

const PaymentSchema = z.object({
  reference: z.string(),
  planCode: z.string(),
  status: z.string(),
  amountInCents: z.number(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  periodEndsAt: z.string().nullable(),
  paymentMethodType: z.string().nullable(),
});

/** Una orden de pago del plan, tal como la devuelve `GET /subscription/payments`. */
export type PlanPayment = z.infer<typeof PaymentSchema>;

/** `GET /subscription/payments`: el historial de pagos del plan, de la más reciente a la más vieja (solo quien administra). */
export function fetchPlanPayments(): Promise<Result<PlanPayment[], ApiFailure>> {
  return authedRequest('/subscription/payments', (body) => z.object({ items: z.array(PaymentSchema) }).parse(body).items);
}
