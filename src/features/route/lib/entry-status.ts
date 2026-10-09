import type { RouteEntry } from '@/features/route/lib/route-entry';

/**
 * Estado de un préstamo para el cobrador (los chips del diseño):
 * - `paid`: saldo cero.
 * - `on-time`: nada vencido.
 * - `late` (ATRASO): vencido hasta `LATE_MAX_DAYS` días.
 * - `overdue` (MORA): vencido por más de `LATE_MAX_DAYS` días.
 */
export type EntryStatus = 'paid' | 'on-time' | 'late' | 'overdue';

/**
 * Hasta cuántos días de vencido es "atraso" y desde cuántos "mora". El API solo entrega los días
 * (`overdueDays`); la frontera de 7 días es una decisión de la app, alineada con el primer rango
 * del dashboard del Lender (0-7, 8-15, 16-30, 30+ días, D-100). Es una suposición de producto
 * pendiente de confirmar (M-13): cambiarla es cambiar esta constante.
 */
export const LATE_MAX_DAYS = 7;

/** Clasifica una fila de la ruta. `paid` gana sobre lo demás: un saldo cero no puede estar en mora. */
export function classifyEntry(entry: Pick<RouteEntry, 'balance' | 'overdueAmount' | 'overdueDays'>): EntryStatus {
  if (entry.balance <= 0) return 'paid';
  if (entry.overdueAmount <= 0 && entry.overdueDays <= 0) return 'on-time';
  return entry.overdueDays > LATE_MAX_DAYS ? 'overdue' : 'late';
}

/** Texto de los días de vencido que acompaña al chip (`"12 días"`, `"1 día"`, `"0 días"`). */
export function overdueDaysLabel(days: number): string {
  return `${String(days)} ${days === 1 ? 'día' : 'días'}`;
}
