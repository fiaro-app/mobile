import { ConsolidatedSchema, type Consolidated } from '@/features/consolidated/lib/consolidated-schemas';
import type { DateRange } from '@/features/stats/lib/stats-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** `QUERY /lenders/me/consolidated-stats`: las cifras de todos los negocios que administra la persona (solo Team y la prueba). */
export function fetchConsolidated(range: DateRange): Promise<Result<Consolidated, ApiFailure>> {
  return authedRequest('/lenders/me/consolidated-stats', (body) => ConsolidatedSchema.parse(body), { method: 'QUERY', body: { dateRange: range } });
}
