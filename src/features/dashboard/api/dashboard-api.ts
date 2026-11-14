import { DashboardSchema, type Dashboard } from '@/features/dashboard/lib/dashboard-schemas';
import type { DateRangeValue } from '@/lib/date-range';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/**
 * `GET /lenders/me/dashboard`: cartera, cobrado hoy, cobradores, mora, alertas y cuadres por revisar. Con un rango (hasta 366
 * días), lo cobrado y la efectividad también vienen de ese período (`?from&to`).
 */
export function fetchDashboard(range: DateRangeValue | null = null): Promise<Result<Dashboard, ApiFailure>> {
  const query = range ? `?from=${range.from}&to=${range.to}` : '';
  return authedRequest(`/lenders/me/dashboard${query}`, (body) => DashboardSchema.parse(body));
}
