import type { PeriodStats } from '@/features/stats/lib/stats-schemas';
import { effectivenessTone, type Tone } from '@/features/dashboard/lib/dashboard-view-model';
import { formatShortDate } from '@/lib/business-date';
import { formatCop, formatPercent } from '@/lib/format-cop';

/** Desempeño de un cobrador listo para dibujar. */
export interface CollectorStatsView {
  readonly period: string;
  readonly cards: readonly { readonly key: string; readonly label: string; readonly value: string; readonly tone: Tone }[];
}

/** Efectividad menor a este valor se pinta en rojo en la ficha de UN cobrador (la web usa 0.6 aquí, distinto del Resumen). */
export const LOW_EFFECTIVENESS = 0.6;

function tone(ratio: number | null): Tone {
  if (ratio === null) return 'neutral';
  return ratio < LOW_EFFECTIVENESS ? 'bad' : effectivenessTone(ratio) === 'good' ? 'good' : 'warning';
}

/** Convierte las estadísticas de un cobrador en cifras y tonos (la mora vencida en rojo si hay). */
export function toCollectorStatsView(stats: PeriodStats): CollectorStatsView {
  return {
    period: `${formatShortDate(stats.from)} – ${formatShortDate(stats.to)}`,
    cards: [
      { key: 'collected', label: 'Cobrado', value: formatCop(stats.collectedAmount), tone: 'neutral' },
      { key: 'expected', label: 'Esperado', value: formatCop(stats.expectedAmount), tone: 'neutral' },
      { key: 'effectiveness', label: 'Efectividad', value: formatPercent(stats.effectiveness), tone: tone(stats.effectiveness) },
      { key: 'visits', label: 'Visitas', value: String(stats.visitsCount), tone: 'neutral' },
      { key: 'overdue', label: 'Cartera vencida', value: formatCop(stats.overdueAmount), tone: stats.overdueAmount > 0 ? 'bad' : 'good' },
    ],
  };
}
