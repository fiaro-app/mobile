import type { CollectorsToday } from '@/features/collectors-today/lib/collectors-today-schemas';
import { formatCop } from '@/lib/format-cop';

type Tone = 'good' | 'warning' | 'bad' | 'neutral';

const STATUS: Record<CollectorsToday['collectors'][number]['status'], { label: string; tone: Tone }> = {
  NOT_STARTED: { label: 'Sin iniciar', tone: 'warning' },
  IN_PROGRESS: { label: 'En ruta', tone: 'neutral' },
  FINISHED: { label: 'Terminó', tone: 'good' },
  NO_ROUTE: { label: 'Sin ruta', tone: 'neutral' },
};

/** Una fila de «Rutas de hoy», lista para dibujar con `SettlementRow`. */
export interface RouteProgressRow {
  readonly id: string;
  readonly name: string;
  readonly detail: string;
  readonly amount: string;
  readonly tone: Tone;
  readonly badge: string;
}

/** Lo que el Resumen dibuja en «Rutas de hoy». */
export interface RouteProgressModel {
  readonly summary: string;
  readonly rows: readonly RouteProgressRow[];
}

/**
 * La hora de un instante en Colombia (`8:05 a. m.`). Colombia no tiene horario de verano: siempre es UTC−5, así que
 * no hace falta `Intl` (que en el teléfono no siempre trae zonas horarias).
 */
export function bogotaTime(instant: string): string {
  const date = new Date(instant);
  const hours = (date.getUTCHours() + 19) % 24;
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'a. m.' : 'p. m.';
  return `${String(hours % 12 === 0 ? 12 : hours % 12)}:${minutes} ${suffix}`;
}

function summaryOf(counts: CollectorsToday['counts']): string {
  const active = counts.NOT_STARTED + counts.IN_PROGRESS + counts.FINISHED;
  if (active === 0) return 'Ningún cobrador tiene ruta hoy.';
  return `${String(counts.IN_PROGRESS + counts.FINISHED)} de ${String(active)} cobradores ya iniciaron su ruta · ${String(counts.FINISHED)} la terminaron`;
}

/** Convierte la respuesta de la API en las filas y el resumen de «Rutas de hoy». */
export function buildRouteProgress(today: CollectorsToday): RouteProgressModel {
  return {
    summary: summaryOf(today.counts),
    rows: today.collectors.map((collector) => {
      const started = collector.firstVisitAt === null ? '' : ` · inició ${bogotaTime(collector.firstVisitAt)}`;
      return {
        id: collector.membershipId,
        name: collector.fullName,
        detail: `${String(collector.visitedLoans)} de ${String(collector.routeLoans)} visitados · faltan ${String(collector.pendingLoans)}${started}`,
        amount: `${formatCop(collector.collectedAmount)} de ${formatCop(collector.expectedAmount)}`,
        tone: STATUS[collector.status].tone,
        badge: STATUS[collector.status].label,
      };
    }),
  };
}
