import { DailySummarySchema, SettlementSchema, type DailySummary, type Settlement, type SettlementRequest } from '@/features/settlement/lib/settlement-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** `QUERY /collectors/me/daily-summary`: lo que debía cobrar hoy y lo que ya cobró, por medio de pago. */
export function fetchDailySummary(date?: string): Response<DailySummary> {
  return authedRequest('/collectors/me/daily-summary', (body) => DailySummarySchema.parse(body), {
    method: 'QUERY',
    body: date ? { date } : {},
  });
}

/**
 * `POST /daily-settlements`: envía el cuadre del día. Reenviar el de hoy lo devuelve a `PENDING` (es la
 * forma de corregirlo tras un rechazo); el API exige `collectorNote` si lo cobrado difiere de lo esperado.
 */
export function postSettlement(request: SettlementRequest): Response<Settlement> {
  return authedRequest('/daily-settlements', (body) => SettlementSchema.parse(body), { method: 'POST', body: request });
}

/** `GET /daily-settlements/:id`: estado actual de un cuadre ya enviado (el prestamista pudo revisarlo). */
export function fetchSettlement(id: string): Response<Settlement> {
  return authedRequest(`/daily-settlements/${id}`, (body) => SettlementSchema.parse(body));
}
