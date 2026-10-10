import { ReportPageSchema, type ReportEntry } from '@/features/collections-report/lib/report-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Visitas por página. */
export const REPORT_PAGE_SIZE = 30;

/** Una página del reporte. */
export interface ReportPage {
  readonly items: ReportEntry[];
  readonly total: number;
}

/**
 * `QUERY /collection-visits`: las visitas de todo el negocio en un día (solo Owner y Lender). Se pide un solo día
 * (`from` = `to`); `PAID` filtra en el API, el resto se filtra en la app.
 */
export function fetchReport(page: number, date: string, paidOnly: boolean): Promise<Result<ReportPage, ApiFailure>> {
  return authedRequest(
    '/collection-visits',
    (body) => {
      const parsed = ReportPageSchema.parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    { method: 'QUERY', body: { page, pageSize: REPORT_PAGE_SIZE, dateRange: { from: date, to: date }, ...(paidOnly ? { outcome: 'PAID' } : {}) } },
  );
}
