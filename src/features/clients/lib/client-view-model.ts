import { initials } from '@/features/auth/lib/names';
import { displayPhone } from '@/features/collectors/lib/collector-view-model';
import type { ClientListItem } from '@/features/clients/lib/client-schemas';
import type { BadgeKind } from '@/components/atoms/Badge';
import { classifyEntry, overdueDaysLabel } from '@/lib/loan-status';
import { formatCop } from '@/lib/format-cop';

/** Filtro por situación de pago (se aplica a lo ya cargado: el API solo busca por texto). */
export type ClientFilter = 'all' | 'current' | 'arrears';

/** Fila de la lista de clientes. */
export interface ClientRowModel {
  readonly id: string;
  readonly initials: string;
  readonly name: string;
  readonly subtitle: string;
  readonly detail: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
  readonly trailing: string;
}

/** Cantidad de préstamos vigentes en palabras ("Sin préstamos activos", "1 préstamo", "2 préstamos"). */
export function activeLoansLabel(count: number): string {
  if (count === 0) return 'Sin préstamos activos';
  return `${String(count)} ${count === 1 ? 'préstamo' : 'préstamos'}`;
}

/**
 * Estado de un cliente para el distintivo, con la MISMA regla de mora que la web y la ruta del cobrador (0 días al día,
 * 1–7 atraso, más de 7 mora). Sin préstamos activos no hay estado de pago que mostrar.
 */
export function clientBadge(client: Pick<ClientListItem, 'balance' | 'overdueDays' | 'activeLoans'>): { label: string; kind: BadgeKind } {
  if (client.activeLoans === 0) return { label: 'SIN DEUDA', kind: 'neutral' };
  switch (classifyEntry(client)) {
    case 'delinquent':
      return { label: 'MORA', kind: 'bad' };
    case 'late':
      return { label: 'ATRASO', kind: 'warning' };
    default:
      return { label: 'AL DÍA', kind: 'good' };
  }
}

/** `true` si el cliente cumple el filtro de situación de pago. */
export function matchesFilter(client: ClientListItem, filter: ClientFilter): boolean {
  if (filter === 'all') return true;
  const inArrears = client.activeLoans > 0 && client.overdueDays > 0;
  return filter === 'arrears' ? inArrears : client.activeLoans > 0 && !inArrears;
}

/** Convierte un cliente del API en su fila de lista. */
export function toClientRow(client: ClientListItem): ClientRowModel {
  const arrears = client.activeLoans > 0 && client.overdueDays > 0;
  return {
    id: client.id,
    initials: initials(client.fullName),
    name: client.fullName,
    subtitle: `CC ${client.nationalId} · ${displayPhone(client.phone)}`,
    detail: arrears ? `Mora ${overdueDaysLabel(client.overdueDays)} · ${formatCop(client.overdueAmount)}` : activeLoansLabel(client.activeLoans),
    badge: clientBadge(client),
    trailing: client.activeLoans > 0 ? `Saldo ${formatCop(client.balance)}` : '',
  };
}
