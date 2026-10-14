import type { Tone } from '@/features/dashboard/lib/dashboard-view-model';

/** Si subir es bueno (cobrado), malo (mora) o indiferente (cartera). */
export type TrendPolarity = 'higher-is-better' | 'lower-is-better' | 'neutral';

/** Variación frente al período anterior, lista para mostrar. */
export interface Trend {
  readonly direction: 'up' | 'down' | 'flat';
  readonly label: string;
  readonly tone: Tone;
}

/** Cambios menores a esto (en % o puntos) se consideran "igual". */
const FLAT_BELOW = 0.5;

function toneOf(direction: Trend['direction'], polarity: TrendPolarity): Tone {
  if (direction === 'flat' || polarity === 'neutral') return 'neutral';
  return (direction === 'up') === (polarity === 'higher-is-better') ? 'good' : 'bad';
}

function build(change: number, unit: string, polarity: TrendPolarity): Trend {
  if (Math.abs(change) < FLAT_BELOW) return { direction: 'flat', label: '= igual', tone: 'neutral' };
  const direction = change > 0 ? 'up' : 'down';
  return { direction, label: `${direction === 'up' ? '↑' : '↓'} ${String(Math.round(Math.abs(change)))} ${unit}`, tone: toneOf(direction, polarity) };
}

/** Variación relativa en % (`null` si no hay período anterior o es cero: dividiría por cero). */
export function relativeTrend(current: number, previous: number | null | undefined, polarity: TrendPolarity): Trend | null {
  if (previous === null || previous === undefined || previous === 0) return null;
  return build(((current - previous) / previous) * 100, '%', polarity);
}

/** Variación en puntos porcentuales de una proporción (efectividad, % en mora). */
export function pointsTrend(current: number | null, previous: number | null | undefined, polarity: TrendPolarity): Trend | null {
  if (current === null || previous === null || previous === undefined) return null;
  return build((current - previous) * 100, 'pts', polarity);
}
