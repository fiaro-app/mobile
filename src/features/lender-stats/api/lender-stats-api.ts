import { LenderStatsSchema, type LenderStats } from '@/features/lender-stats/lib/lender-stats-schemas';
import { authedDownload, type DownloadedFile } from '@/lib/files/download';
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

/** Nombre del PDF si el API no sugiere uno. */
export const DEFAULT_STATS_FILENAME = 'estadisticas.pdf';

/** `QUERY /lenders/me/stats/export`: las mismas estadísticas en un PDF descargable (mismos filtros que la pantalla). */
export function exportStatsPdf(range: DateRange, collectorMembershipId?: string): Promise<Result<DownloadedFile, ApiFailure>> {
  return authedDownload('/lenders/me/stats/export', {
    method: 'QUERY',
    body: { dateRange: range, includePrevious: true, format: 'pdf', ...(collectorMembershipId ? { collectorMembershipId } : {}) },
  });
}
