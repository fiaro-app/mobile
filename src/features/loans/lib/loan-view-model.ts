import type { BadgeKind } from '@/components/atoms/Badge';
import type { Frequency, LoanListItem, LoanStatus } from '@/features/loans/lib/loan-schemas';
import { classifyEntry } from '@/lib/loan-status';
import { formatCop } from '@/lib/format-cop';

/** Adjetivo plural de la frecuencia ("30 cuotas diarias"). */
const FREQUENCY_PLURAL: Record<Frequency, string> = { DAILY: 'diarias', WEEKLY: 'semanales', BIWEEKLY: 'quincenales', MONTHLY: 'mensuales' };

/** Adjetivo singular de la frecuencia ("cuota diaria"). */
const FREQUENCY_SINGULAR: Record<Frequency, string> = { DAILY: 'diaria', WEEKLY: 'semanal', BIWEEKLY: 'quincenal', MONTHLY: 'mensual' };

/** `$1.000.000 · 30 cuotas diarias`. */
export function loanSummary(loan: Pick<LoanListItem, 'principalAmount' | 'installmentCount' | 'frequency'>): string {
  const count = loan.installmentCount;
  const noun = count === 1 ? 'cuota' : 'cuotas';
  const adjective = count === 1 ? FREQUENCY_SINGULAR[loan.frequency] : FREQUENCY_PLURAL[loan.frequency];
  return `${formatCop(loan.principalAmount)} · ${String(count)} ${noun} ${adjective}`;
}

/** `$35.000 diaria` (valor de la cuota y su frecuencia). */
export function installmentLabel(loan: Pick<LoanListItem, 'installmentValue' | 'frequency'>): string {
  return `${formatCop(loan.installmentValue)} ${FREQUENCY_SINGULAR[loan.frequency]}`;
}

/** Distintivo del préstamo: anulado, pagado o, si está vigente, su situación de pago (misma regla de mora que en todo el sistema). */
export function loanBadge(loan: Pick<LoanListItem, 'status' | 'balance' | 'overdueDays'>): { label: string; kind: BadgeKind } {
  const status: LoanStatus = loan.status;
  if (status === 'CANCELED') return { label: 'ANULADO', kind: 'neutral' };
  if (status === 'PAID_OFF') return { label: 'PAGADO', kind: 'good' };
  switch (classifyEntry(loan)) {
    case 'delinquent':
      return { label: 'MORA', kind: 'bad' };
    case 'late':
      return { label: 'ATRASO', kind: 'warning' };
    case 'paid':
      return { label: 'PAGADO', kind: 'good' };
    default:
      return { label: 'AL DÍA', kind: 'good' };
  }
}

/** Una fila de préstamo lista para dibujar. */
export interface LoanRowModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly detail: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
}

/**
 * Fila de préstamo. `title` es el cliente cuando se lista de todos los clientes y el resumen del préstamo cuando ya se
 * está en la ficha de un cliente (`clientName` en `null`).
 */
export function toLoanRow(loan: LoanListItem, clientName: string | null): LoanRowModel {
  const summary = loanSummary(loan);
  return {
    id: loan.id,
    title: clientName ?? summary,
    subtitle: clientName === null ? `Saldo ${formatCop(loan.balance)} · Cuota ${installmentLabel(loan)}` : summary,
    detail: clientName === null ? '' : `Saldo ${formatCop(loan.balance)}`,
    badge: loanBadge(loan),
  };
}
