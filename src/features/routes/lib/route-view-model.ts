import type { RouteDay } from '@/features/routes/lib/route-schemas';
import { formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';

/** Una fila del registro: lo que hizo un cobrador en un día. */
export interface RouteRowModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly detail: string;
  readonly trailing: string;
}

/** Hora en hora de Colombia (`4:12 p. m.`). */
function timeOf(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(/\s+/g, ' ');
}

/**
 * Fila: el cobrador, el día y de qué hora a qué hora fue la ruta; abajo las visitas y cuántas terminaron en pago; a la
 * derecha, lo cobrado.
 */
export function toRouteRow(route: RouteDay): RouteRowModel {
  const visits = `${String(route.visitsCount)} ${route.visitsCount === 1 ? 'visita' : 'visitas'}`;
  return {
    id: `${route.date}|${route.collector.membershipId}`,
    title: route.collector.fullName,
    subtitle: `${formatShortDate(route.date)} · de ${timeOf(route.startedAt)} a ${timeOf(route.endedAt)}`,
    detail: `${visits} · ${String(route.paidCount)} en pago · esperado ${formatCop(route.expectedAmount)}`,
    trailing: formatCop(route.collectedAmount),
  };
}
