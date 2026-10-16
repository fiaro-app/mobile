import { RoutesPageSchema, type RouteDay } from '@/features/routes/lib/route-schemas';
import type { DateRangeValue } from '@/lib/date-range';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Rutas por página. */
export const ROUTES_PAGE_SIZE = 10;

/** Una página del registro de rutas. */
export interface RoutesPage {
  readonly items: RouteDay[];
  readonly total: number;
}

/** Filtros del registro, tal como viajan a la API. */
export interface RoutesQuery {
  /** Sin rango la API entrega solo hoy. */
  readonly range: DateRangeValue | null;
  readonly collectorId: string | null;
}

/**
 * `QUERY /collection-visits/routes`: un renglón por cobrador y día (solo Owner y Lender) en un rango de hasta 93 días, o
 * hoy sin rango; opcionalmente de un cobrador. Todo se filtra en la API para que el total y las páginas cuadren.
 */
export function fetchRoutes(page: number, query: RoutesQuery): Promise<Result<RoutesPage, ApiFailure>> {
  return authedRequest(
    '/collection-visits/routes',
    (body) => {
      const parsed = RoutesPageSchema.parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    {
      method: 'QUERY',
      body: {
        page,
        pageSize: ROUTES_PAGE_SIZE,
        ...(query.range ? { dateRange: query.range } : {}),
        ...(query.collectorId ? { collectorMembershipId: query.collectorId } : {}),
      },
    },
  );
}
