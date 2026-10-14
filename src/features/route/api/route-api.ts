import { RouteSchema, type RouteEntry } from '@/features/route/lib/route-entry';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/**
 * Pide la ruta del día del cobrador (`QUERY /collectors/me/route`). Sin `date` el API devuelve la de
 * hoy. Exige el rol `COLLECTOR`: con otro rol responde 403 `FORBIDDEN`.
 *
 * @param date - Fecha de negocio `AAAA-MM-DD`, o `undefined` para hoy.
 */
export function fetchRoute(date?: string): Promise<Result<RouteEntry[], ApiFailure>> {
  return authedRequest('/collectors/me/route', (body) => RouteSchema.parse(body), {
    method: 'QUERY',
    body: date ? { date } : {},
  });
}
