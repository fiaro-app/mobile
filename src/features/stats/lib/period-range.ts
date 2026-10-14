import type { DateRange } from '@/features/stats/lib/stats-schemas';

/** Períodos que ofrece la pantalla de estadísticas. */
export type Period = 'week' | 'month' | 'year';

const DAY_MS = 86_400_000;

function toUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

function toText(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function shiftMonths(date: Date, months: number): Date {
  const total = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  const year = Math.floor(total / 12);
  const month = total % 12;
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), daysInMonth(year, month))));
}

/**
 * Rango del período en curso hasta hoy: la semana empieza el lunes (como en Colombia), el mes el día 1 y el
 * año el 1 de enero. `today` es la fecha de negocio (`businessDateOf`), no la de UTC.
 */
export function currentRange(period: Period, today: string): DateRange {
  const end = toUtc(today);
  if (period === 'week') {
    const sinceMonday = (end.getUTCDay() + 6) % 7;
    return { from: toText(new Date(end.getTime() - sinceMonday * DAY_MS)), to: today };
  }
  const start = period === 'month' ? new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1)) : new Date(Date.UTC(end.getUTCFullYear(), 0, 1));
  return { from: toText(start), to: today };
}

/**
 * El período anterior con la MISMA duración transcurrida, para comparar parejo: a mitad de mes se compara contra
 * la primera mitad del mes pasado, no contra el mes completo (que siempre saldría más grande).
 */
export function previousRange(period: Period, today: string): DateRange {
  const current = currentRange(period, today);
  const from = toUtc(current.from);
  const to = toUtc(current.to);
  if (period === 'week') return { from: toText(new Date(from.getTime() - 7 * DAY_MS)), to: toText(new Date(to.getTime() - 7 * DAY_MS)) };
  const months = period === 'month' ? -1 : -12;
  return { from: toText(shiftMonths(from, months)), to: toText(shiftMonths(to, months)) };
}
