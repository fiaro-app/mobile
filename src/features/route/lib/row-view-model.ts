import { classifyEntry, overdueDaysLabel, type EntryStatus } from '@/lib/loan-status';
import type { RouteEntry } from '@/features/route/lib/route-entry';
import { initials } from '@/features/auth/lib/names';
import { formatCop } from '@/lib/format-cop';

/** Una fila de cliente lista para dibujar: todo ya formateado, sin lógica pendiente. */
export interface RowViewModel {
  readonly id: string;
  readonly clientId: string;
  readonly name: string;
  readonly initials: string;
  readonly balanceLabel: string;
  readonly status: EntryStatus;
  readonly daysLabel: string;
  readonly daysAlert: boolean;
  /** `Cobrado hoy $X` si ya se le cobró hoy; `null` si no. */
  readonly collectedLabel: string | null;
}

/**
 * Convierte una fila de la API en lo que dibuja `ClientRow`. Los días van en rojo cuando hay algo
 * vencido (`daysAlert`), igual que en el diseño: "12 días" y "3 días" rojos, "0 días" en tinta.
 */
export function toRowViewModel(entry: RouteEntry): RowViewModel {
  return {
    id: entry.loanId,
    clientId: entry.clientId,
    name: entry.clientFullName,
    initials: initials(entry.clientFullName),
    balanceLabel: formatCop(entry.balance),
    status: classifyEntry(entry),
    daysLabel: overdueDaysLabel(entry.overdueDays),
    daysAlert: entry.overdueDays > 0 && entry.balance > 0,
    collectedLabel: entry.collectedToday > 0 ? `Cobrado hoy ${formatCop(entry.collectedToday)}` : null,
  };
}
