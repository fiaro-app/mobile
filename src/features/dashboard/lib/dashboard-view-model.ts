import type { Dashboard } from '@/features/dashboard/lib/dashboard-schemas';
import { formatCop, formatCopCompact, formatPercent } from '@/lib/format-cop';

/** Efectividad desde la que es buena (verde) y aceptable (ámbar); por debajo, baja (roja). Igual que la web. */
export const EFFECTIVENESS_GOOD_FROM = 0.9;
export const EFFECTIVENESS_ACCEPTABLE_FROM = 0.7;

/** Intención visual de una cifra. */
export type Tone = 'neutral' | 'good' | 'warning' | 'bad';

/** Tono de la efectividad: buena, aceptable o baja; sin dato, neutro. */
export function effectivenessTone(ratio: number | null): Tone {
  if (ratio === null) return 'neutral';
  if (ratio >= EFFECTIVENESS_GOOD_FROM) return 'good';
  return ratio >= EFFECTIVENESS_ACCEPTABLE_FROM ? 'warning' : 'bad';
}

/** Una cifra de la fila de indicadores. */
export interface Kpi {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly tone: Tone;
}

/** Tono de la diferencia de un cuadre: cuadra (verde), faltante (rojo) o sobrante (ámbar). */
function differenceTone(difference: number): Tone {
  if (difference === 0) return 'good';
  return difference < 0 ? 'bad' : 'warning';
}

/** Un cuadre por revisar, listo para dibujar. */
export interface PendingRow {
  readonly id: string;
  readonly collectorName: string;
  readonly expected: string;
  readonly difference: string;
  readonly differenceTone: Tone;
}

/** Todo lo que el Resumen dibuja. */
export interface DashboardModel {
  readonly kpis: readonly Kpi[];
  readonly alerts: readonly string[];
  readonly pending: readonly PendingRow[];
}

/** Nombre mostrado cuando el cuadre es de alguien que ya no aparece entre los colaboradores. */
export const UNKNOWN_COLLECTOR = 'Cobrador sin nombre';

/**
 * Convierte el resumen del API en lo que se dibuja. La diferencia de un cuadre es cobrado − esperado: negativa
 * (faltante) en rojo, positiva (sobrante) en ámbar, y cero se muestra sin cifra (cuadra).
 *
 * @param names - Nombre de cada colaborador por `membershipId`.
 * @param periodFiltered - Si se pidió un período: lo cobrado y la efectividad pasan a ser los de ese período (como en la web).
 */
export function buildDashboardModel(dashboard: Dashboard, names: ReadonlyMap<string, string>, periodFiltered = false): DashboardModel {
  const collected = periodFiltered ? (dashboard.collectedInPeriod ?? dashboard.collectedToday) : dashboard.collectedToday;
  const effectiveness = periodFiltered ? (dashboard.effectivenessInPeriod ?? null) : dashboard.effectivenessToday;
  return {
    kpis: [
      { key: 'portfolio', label: 'Cartera total', value: formatCopCompact(dashboard.totalPortfolio), tone: 'neutral' },
      { key: 'collected', label: periodFiltered ? 'Cobrado en el período' : 'Cobrado hoy', value: formatCopCompact(collected), tone: 'good' },
      { key: 'collectors', label: 'Cobradores activos', value: `${String(dashboard.activeCollectors)} / ${String(dashboard.totalCollectors)}`, tone: 'neutral' },
      { key: 'effectiveness', label: periodFiltered ? 'Efectividad del período' : 'Efectividad de hoy', value: formatPercent(effectiveness), tone: effectivenessTone(effectiveness) },
      { key: 'arrears', label: 'Clientes en mora', value: String(dashboard.clientsInArrears), tone: dashboard.clientsInArrears > 0 ? 'bad' : 'neutral' },
    ],
    alerts: dashboard.alerts,
    pending: dashboard.pendingSettlements.map((settlement) => {
      const difference = settlement.collectedAmount - settlement.expectedAmount;
      return {
        id: settlement.id,
        collectorName: names.get(settlement.collectorMembershipId) ?? UNKNOWN_COLLECTOR,
        expected: `Cuadre: ${formatCop(settlement.expectedAmount)}`,
        difference: difference === 0 ? 'Cuadra' : formatCop(difference),
        differenceTone: differenceTone(difference),
      };
    }),
  };
}
