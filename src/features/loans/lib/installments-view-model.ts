import type { BadgeKind } from '@/components/atoms/Badge';
import type { Installment, InstallmentStatus } from '@/features/loans/lib/loan-schemas';
import { formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';

const STATUS: Record<InstallmentStatus, { label: string; kind: BadgeKind }> = {
  PAID: { label: 'PAGADA', kind: 'good' },
  PARTIAL: { label: 'PARCIAL', kind: 'warning' },
  OVERDUE: { label: 'VENCIDA', kind: 'bad' },
  PENDING: { label: 'PENDIENTE', kind: 'neutral' },
};

/** Una cuota del calendario lista para dibujar. */
export interface InstallmentRowModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly detail: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
}

/** Resumen del calendario ("17 de 30 pagadas · 3 vencidas"). */
export function summarizeInstallments(installments: readonly Installment[]): string {
  const paid = installments.filter((item) => item.status === 'PAID').length;
  const overdue = installments.filter((item) => item.status === 'OVERDUE').length;
  const base = `${String(paid)} de ${String(installments.length)} pagadas`;
  if (overdue === 0) return base;
  return `${base} · ${String(overdue)} ${overdue === 1 ? 'vencida' : 'vencidas'}`;
}

/** Cuotas ordenadas por número, con valor esperado y, si ya hay algo pagado, lo pagado. */
export function toInstallmentRows(installments: readonly Installment[]): InstallmentRowModel[] {
  return installments
    .toSorted((a, b) => a.number - b.number)
    .map((item) => ({
      id: String(item.number),
      title: `Cuota ${String(item.number)}`,
      subtitle: formatShortDate(item.dueDate),
      detail: item.paidAmount > 0 ? `Pagado ${formatCop(item.paidAmount)} de ${formatCop(item.expectedAmount)}` : formatCop(item.expectedAmount),
      badge: STATUS[item.status],
    }));
}
