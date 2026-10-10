import { LenderStatsSchema, type LenderStats } from '@/features/lender-stats/lib/lender-stats-schemas';
import type { DateRange } from '@/features/stats/lib/stats-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/**
 * `QUERY /lenders/me/stats`: estadísticas del negocio en un rango, con el período anterior (`includePrevious`) para las
 * tendencias; opcionalmente de un solo cobrador.
 */
export function fetchLenderStats(range: DateRange, collectorMembershipId?: string): Promise<Result<LenderStats, ApiFailure>> {
  return authedRequest('/lenders/me/stats', (body) => LenderStatsSchema.parse(body), {
    method: 'QUERY',
    body: { dateRange: range, includePrevious: true, ...(collectorMembershipId ? { collectorMembershipId } : {}) },
  });
}
