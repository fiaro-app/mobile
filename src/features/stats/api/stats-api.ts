import { PeriodStatsSchema, type DateRange, type PeriodStats } from '@/features/stats/lib/stats-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** `QUERY /collectors/me/stats`: totales del cobrador en un rango (sin rango, el API usa el mes actual). */
export function fetchPeriodStats(range: DateRange): Promise<Result<PeriodStats, ApiFailure>> {
  return authedRequest('/collectors/me/stats', (body) => PeriodStatsSchema.parse(body), {
    method: 'QUERY',
    body: { dateRange: range },
  });
}
