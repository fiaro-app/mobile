import type { BadgeKind } from '@/components/atoms/Badge';
import type { ReviewSettlement } from '@/features/settlement-review/lib/review-schemas';
import type { SettlementStatus } from '@/features/settlement/lib/settlement-schemas';
import { formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';
import type { Tone } from '@/features/dashboard/lib/dashboard-view-model';

/** Nombre mostrado cuando el cuadre es de alguien que ya no aparece entre los colaboradores. */
export const UNKNOWN_COLLECTOR = 'Cobrador sin nombre';

const STATUS: Record<SettlementStatus, { label: string; kind: BadgeKind }> = {
  PENDING: { label: 'PENDIENTE', kind: 'warning' },
  APPROVED: { label: 'APROBADO', kind: 'good' },
  REJECTED: { label: 'RECHAZADO', kind: 'bad' },
};

/** Diferencia cobrado − esperado con su tono: cuadra (verde, sin cifra), faltante (rojo) o sobrante (ámbar). */
export function describeDifference(expected: number, collected: number): { text: string; tone: Tone } {
  const difference = collected - expected;
  if (difference === 0) return { text: 'Cuadra', tone: 'good' };
  return { text: formatCop(difference), tone: difference < 0 ? 'bad' : 'warning' };
}

/** Una fila de la lista de cuadres. */
export interface ReviewRowModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly difference: string;
  readonly differenceTone: Tone;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
}

/** Fila de cuadre: cobrador, fecha y cuadre esperado, la diferencia y el estado. */
export function toReviewRow(settlement: ReviewSettlement, names: ReadonlyMap<string, string>): ReviewRowModel {
  const difference = describeDifference(settlement.expectedAmount, settlement.collectedAmount);
  return {
    id: settlement.id,
    title: names.get(settlement.collectorMembershipId) ?? UNKNOWN_COLLECTOR,
    subtitle: `${formatShortDate(settlement.date)} · Cuadre ${formatCop(settlement.expectedAmount)}`,
    difference: difference.text,
    differenceTone: difference.tone,
    badge: STATUS[settlement.status],
  };
}

/** Detalle de un cuadre listo para dibujar. */
export interface ReviewDetailModel {
  readonly collectorName: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
  readonly rows: readonly { readonly label: string; readonly value: string; readonly alert?: boolean }[];
  readonly difference: string;
  readonly differenceTone: Tone;
  readonly collectorNote: string | null;
  readonly reviewNote: string | null;
  readonly reviewable: boolean;
  readonly summary: string;
}

/** Detalle del cuadre: esperado, cobrado por medio de pago, diferencia, notas y si todavía se puede revisar (solo `PENDING`). */
export function toReviewDetail(settlement: ReviewSettlement, collectorName: string): ReviewDetailModel {
  const difference = describeDifference(settlement.expectedAmount, settlement.collectedAmount);
  const methods = settlement.collectedByMethod;
  return {
    collectorName,
    badge: STATUS[settlement.status],
    rows: [
      { label: 'Fecha', value: formatShortDate(settlement.date) },
      { label: 'Esperado', value: formatCop(settlement.expectedAmount) },
      { label: 'Efectivo', value: formatCop(methods.CASH) },
      { label: 'Nequi', value: formatCop(methods.NEQUI) },
      { label: 'Transferencia', value: formatCop(methods.TRANSFER) },
      { label: 'Cobrado', value: formatCop(settlement.collectedAmount) },
      { label: 'Diferencia', value: difference.text, alert: difference.tone === 'bad' },
      { label: 'Enviado', value: formatShortDate(settlement.submittedAt) },
      ...(settlement.reviewedAt ? [{ label: 'Revisado', value: formatShortDate(settlement.reviewedAt) }] : []),
    ],
    difference: difference.text,
    differenceTone: difference.tone,
    collectorNote: settlement.collectorNote,
    reviewNote: settlement.reviewNote,
    reviewable: settlement.status === 'PENDING',
    summary: `${formatCop(settlement.collectedAmount)} de ${formatCop(settlement.expectedAmount)} esperados`,
  };
}
