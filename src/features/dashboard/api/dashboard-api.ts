import { DashboardSchema, type Dashboard } from '@/features/dashboard/lib/dashboard-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** `GET /lenders/me/dashboard`: cartera, cobrado hoy, cobradores, mora, alertas y cuadres por revisar. */
export function fetchDashboard(): Promise<Result<Dashboard, ApiFailure>> {
  return authedRequest('/lenders/me/dashboard', (body) => DashboardSchema.parse(body));
}
