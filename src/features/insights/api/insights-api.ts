import { InsightsSchema, type Insights } from '@/features/insights/lib/insights-schemas';
import type { DateRange } from '@/features/stats/lib/stats-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** `QUERY /lenders/me/stats/insights`: cómo va el negocio en un rango (solo Owner y Lender). */
export function fetchInsights(range: DateRange): Promise<Result<Insights, ApiFailure>> {
  return authedRequest('/lenders/me/stats/insights', (body) => InsightsSchema.parse(body), { method: 'QUERY', body: { dateRange: range } });
}
