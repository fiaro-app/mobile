import {
  CollectorPerformanceSchema,
  LenderStatsSchema,
  TopArrearsEntrySchema,
  statsPageSchema,
  type CollectorPerformance,
  type LenderStats,
  type TopArrearsEntry,
} from '@/features/lender-stats/lib/lender-stats-schemas';
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

/** Filas por página de las listas largas de las estadísticas (10, lo que la API usa por defecto). */
export const STATS_LIST_PAGE_SIZE = 10;

/** Una página de una lista larga. */
export interface StatsListPage<T> {
  readonly items: T[];
  readonly total: number;
}

/** `QUERY /lenders/me/stats/top-arrears`: el ranking completo de mayor mora (la mora es la de hoy: no lleva período). */
export function fetchTopArrears(page: number, collectorMembershipId?: string): Promise<Result<StatsListPage<TopArrearsEntry>, ApiFailure>> {
  return authedRequest(
    '/lenders/me/stats/top-arrears',
    (body) => {
      const parsed = statsPageSchema(TopArrearsEntrySchema).parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    { method: 'QUERY', body: { page, pageSize: STATS_LIST_PAGE_SIZE, ...(collectorMembershipId ? { collectorMembershipId } : {}) } },
  );
}

/** `QUERY /lenders/me/stats/collector-performance`: el desempeño de todos los cobradores en el período. */
export function fetchCollectorPerformance(page: number, range: DateRange): Promise<Result<StatsListPage<CollectorPerformance>, ApiFailure>> {
  return authedRequest(
    '/lenders/me/stats/collector-performance',
    (body) => {
      const parsed = statsPageSchema(CollectorPerformanceSchema).parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    { method: 'QUERY', body: { page, pageSize: STATS_LIST_PAGE_SIZE, dateRange: range } },
  );
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
