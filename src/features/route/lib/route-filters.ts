import { classifyEntry } from '@/lib/loan-status';
import type { RouteEntry } from '@/features/route/lib/route-entry';

/**
 * Filtros de "Ruta de hoy" pensados para decidir por dónde seguir: lo que falta cobrar, quién está en mora
 * (más de 7 días), en atraso (hasta 7), al día, y lo que ya se cobró hoy. Los de estado solo cuentan lo que aún
 * no pagó hoy: quien ya pagó queda en `collected`.
 */
export type RouteFilter = 'all' | 'pending' | 'delinquent' | 'late' | 'current' | 'collected';

/** Cómo se ordena la ruta: `urgent` respeta el orden del API (mora y deuda juntas). */
export type RouteSort = 'urgent' | 'balance' | 'days' | 'name';

const collectedToday = (entry: RouteEntry) => entry.collectedToday > 0;

const MATCHES: Record<RouteFilter, (entry: RouteEntry) => boolean> = {
  all: () => true,
  pending: (entry) => !collectedToday(entry),
  collected: collectedToday,
  delinquent: (entry) => !collectedToday(entry) && classifyEntry(entry) === 'delinquent',
  late: (entry) => !collectedToday(entry) && classifyEntry(entry) === 'late',
  current: (entry) => !collectedToday(entry) && classifyEntry(entry) === 'current',
};

/** Cuántas filas cumple cada filtro, para mostrarlo en la pastilla. */
export function countByFilter(entries: readonly RouteEntry[]): Record<RouteFilter, number> {
  const counts = { all: 0, pending: 0, delinquent: 0, late: 0, current: 0, collected: 0 };
  for (const filter of Object.keys(counts) as RouteFilter[]) {
    counts[filter] = entries.filter(MATCHES[filter]).length;
  }
  return counts;
}

const COMPARE: Record<Exclude<RouteSort, 'urgent'>, (a: RouteEntry, b: RouteEntry) => number> = {
  balance: (a, b) => b.balance - a.balance,
  days: (a, b) => b.overdueDays - a.overdueDays || b.overdueAmount - a.overdueAmount,
  name: (a, b) => a.clientFullName.localeCompare(b.clientFullName, 'es'),
};

/**
 * Aplica el filtro y el orden. `urgent` deja el orden del API tal cual (ya viene por urgencia, con quien pagó al
 * final); los demás órdenes también mandan al final a quien ya pagó, para no estorbar.
 */
export function applyRouteView(entries: readonly RouteEntry[], filter: RouteFilter, sort: RouteSort): RouteEntry[] {
  const filtered = entries.filter(MATCHES[filter]);
  if (sort === 'urgent') return filtered;
  const compare = COMPARE[sort];
  return [...filtered].sort((a, b) => Number(collectedToday(a)) - Number(collectedToday(b)) || compare(a, b));
}
