import type { RouteEntry } from '@/features/route/lib/route-entry';

/**
 * Estado de un préstamo para el cobrador (los chips del diseño):
 * - `paid`: saldo cero.
 * - `current`: sin días de vencido (una cuota que vence hoy todavía no está atrasada).
 * - `late` (ATRASO): vencido hasta `LATE_MAX_DAYS` días.
 * - `delinquent` (MORA): vencido por más de `LATE_MAX_DAYS` días.
 */
export type EntryStatus = 'paid' | 'current' | 'late' | 'delinquent';

/**
 * Hasta cuántos días de vencido es "atraso" y desde cuántos "mora". El API solo entrega los días
 * (`overdueDays`); la frontera de 7 días la confirmó el dueño del producto (2026-10-09) y es la MISMA
 * en la web y en el móvil: los estados se llaman igual que el `StatusChip` de la web (`current`, `paid`,
 * `late`, `delinquent`). Coincide con el primer rango del dashboard del Lender (0-7, 8-15, 16-30, 30+
 * días, D-100). La fuente única es `overdueStatus` de `@fiaro-app/contracts` (ver ARCHITECTURE.md, M-13);
 * esta copia se reemplaza por ese import cuando se instale el paquete (M-11). Si se cambia, cambia en
 * contracts primero.
 */
export const LATE_MAX_DAYS = 7;

/** Clasifica una fila de la ruta. `paid` gana sobre lo demás: un saldo cero no puede estar en mora. */
export function classifyEntry(entry: Pick<RouteEntry, 'balance' | 'overdueDays'>): EntryStatus {
  if (entry.balance <= 0) return 'paid';
  if (entry.overdueDays <= 0) return 'current';
  return entry.overdueDays > LATE_MAX_DAYS ? 'delinquent' : 'late';
}

/** Texto de los días de vencido que acompaña al chip (`"12 días"`, `"1 día"`, `"0 días"`). */
export function overdueDaysLabel(days: number): string {
  return `${String(days)} ${days === 1 ? 'día' : 'días'}`;
}
