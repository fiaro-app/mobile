import type { PeriodStats } from '@/features/stats/lib/stats-schemas';
import { formatCop } from '@/lib/format-cop';

/** Variación frente al período anterior. */
export interface Comparison {
  readonly text: string;
  readonly direction: 'up' | 'down' | 'same' | 'none';
}

/** Efectividad como porcentaje entero (`0.9` → `90 %`), o `—` si no había nada esperado. */
export function effectivenessLabel(effectiveness: number | null): string {
  return effectiveness === null ? '—' : `${String(Math.round(effectiveness * 100))} %`;
}

/**
 * Compara lo cobrado con el período anterior. Sin cobros previos no hay porcentaje que calcular (dividiría por
 * cero): se dice solo que no hay con qué comparar.
 */
export function compareCollected(current: number, previous: number | undefined): Comparison {
  if (previous === undefined || previous === 0) return { text: 'Sin datos del período anterior', direction: 'none' };
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { text: 'Igual que el período anterior', direction: 'same' };
  return { text: `${percent > 0 ? '+' : ''}${String(percent)} % frente al período anterior`, direction: percent > 0 ? 'up' : 'down' };
}

/** Todo lo que la pantalla muestra de un período, ya formateado. */
export interface StatsModel {
  readonly collected: string;
  readonly expected: string;
  readonly effectiveness: string;
  readonly visits: string;
  readonly overdue: string;
  readonly comparison: Comparison;
}

/** Convierte las estadísticas del API (y las del período anterior, si ya cargaron) en textos. */
export function buildStatsModel(stats: PeriodStats, previous: PeriodStats | undefined): StatsModel {
  return {
    collected: formatCop(stats.collectedAmount),
    expected: formatCop(stats.expectedAmount),
    effectiveness: effectivenessLabel(stats.effectiveness),
    visits: String(stats.visitsCount),
    overdue: formatCop(stats.overdueAmount),
    comparison: compareCollected(stats.collectedAmount, previous?.collectedAmount),
  };
}
