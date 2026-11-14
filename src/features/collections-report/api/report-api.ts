import { ReportPageSchema, type ReportEntry } from '@/features/collections-report/lib/report-schemas';
import type { DateRangeValue } from '@/lib/date-range';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Visitas por página. */
export const REPORT_PAGE_SIZE = 10;

/** Una página del reporte. */
export interface ReportPage {
  readonly items: ReportEntry[];
  readonly total: number;
}

/** Filtros del reporte, tal como viajan a la API. */
export interface ReportQuery {
  /** Sin rango la API entrega solo hoy. */
  readonly range: DateRangeValue | null;
  readonly outcome: ReportEntry['outcome'] | null;
  readonly collectorId: string | null;
}

/**
 * `QUERY /collection-visits`: las visitas de todo el negocio (solo Owner y Lender) en un rango de hasta 93 días, o hoy
 * sin rango; opcionalmente de un resultado y de un cobrador. Todo se filtra en la API para que el total y las páginas
 * cuadren con lo que se ve.
 */
export function fetchReport(page: number, query: ReportQuery): Promise<Result<ReportPage, ApiFailure>> {
  return authedRequest(
    '/collection-visits',
    (body) => {
      const parsed = ReportPageSchema.parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    {
      method: 'QUERY',
      body: {
        page,
        pageSize: REPORT_PAGE_SIZE,
        ...(query.range ? { dateRange: query.range } : {}),
        ...(query.outcome ? { outcome: query.outcome } : {}),
        ...(query.collectorId ? { collectorMembershipId: query.collectorId } : {}),
      },
    },
  );
}
