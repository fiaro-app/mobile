import type { BadgeKind } from '@/components/atoms/Badge';
import type { LoanVisit } from '@/features/loans/lib/loan-schemas';
import { formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';

const OUTCOME_LABELS = { PAID: 'Pago', NOT_FOUND: 'No encontrado', REFUSED: 'Se negó a pagar', RESCHEDULED: 'Reprogramada' } as const;
const METHOD_LABELS = { CASH: 'Efectivo', NEQUI: 'Nequi', TRANSFER: 'Transferencia' } as const;

/** Una visita del historial lista para dibujar. */
export interface VisitRowModel {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly detail: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind } | null;
  readonly trailing: string;
  /** `id` del pago que se puede revertir (solo pagos no revertidos); `null` si no aplica. */
  readonly reversiblePaymentId: string | null;
  /** `id` del pago de la visita (revertido o no), al que se le adjunta el comprobante; `null` si no hubo pago. */
  readonly paymentId: string | null;
}

/**
 * Fila del historial de cobros de un préstamo. Un pago revertido se muestra tachado como "REVERTIDO" con su motivo y ya no se
 * puede revertir otra vez; una visita reprogramada recuerda a qué fecha se prometió el pago.
 *
 * @param names - Nombre del cobrador por `membershipId`.
 */
export function toVisitRow(visit: LoanVisit, names: ReadonlyMap<string, string>): VisitRowModel {
  const collector = names.get(visit.collectorMembershipId) ?? 'Cobrador';
  const when = `${formatShortDate(visit.occurredAt)} · ${collector}`;
  const payment = visit.payment;
  if (visit.outcome === 'PAID' && payment) {
    const method = METHOD_LABELS[payment.method];
    if (payment.reversal) {
      return { id: visit.id, title: `Pago · ${method}`, subtitle: when, detail: `Motivo: ${payment.reversal.reason}`, badge: { label: 'REVERTIDO', kind: 'neutral' }, trailing: formatCop(payment.amount), reversiblePaymentId: null, paymentId: payment.id };
    }
    return { id: visit.id, title: `Pago · ${method}`, subtitle: when, detail: '', badge: null, trailing: formatCop(payment.amount), reversiblePaymentId: payment.id, paymentId: payment.id };
  }
  const detail = visit.outcome === 'RESCHEDULED' && visit.promisedDate ? `Promete pagar el ${formatShortDate(visit.promisedDate)}` : '';
  return { id: visit.id, title: OUTCOME_LABELS[visit.outcome], subtitle: when, detail, badge: null, trailing: '', reversiblePaymentId: null, paymentId: null };
}
