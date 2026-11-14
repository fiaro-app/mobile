import type { BadgeKind } from '@/components/atoms/Badge';
import type { ReportEntry } from '@/features/collections-report/lib/report-schemas';
import { formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';

/** Filtro del reporte: todas las visitas o las de un resultado (lo filtra la API, así la paginación cuadra). */
export type ReportFilter = 'all' | ReportEntry['outcome'];

const OUTCOME_LABELS = { PAID: 'Pago', NOT_FOUND: 'No encontrado', REFUSED: 'Se negó a pagar', RESCHEDULED: 'Reprogramada' } as const;
const METHOD_LABELS = { CASH: 'Efectivo', NEQUI: 'Nequi', TRANSFER: 'Transferencia' } as const;

/** Hora de la visita en hora de Colombia (`4:12 p. m.`). */
export function timeOf(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(iso)).replace(/\s+/g, ' ');
}

/** Una fila del reporte. */
export interface ReportRowModel {
  readonly id: string;
  readonly loanId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly detail: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind } | null;
  readonly trailing: string;
}

/** Fila: cliente, cobrador, hora y medio; el monto a la derecha, o el resultado si no hubo pago. Un pago revertido se marca. */
export function toReportRow(entry: ReportEntry): ReportRowModel {
  const base = { id: entry.visitId, loanId: entry.loan.id, title: entry.client.fullName };
  // Con un rango de varios días la hora sola no basta: va el día (sin el año) delante.
  const when = `${entry.collector.fullName} · ${formatShortDate(entry.occurredAt).replace(/ \d{4}$/, '')}, ${timeOf(entry.occurredAt)}`;
  if (entry.payment) {
    const method = METHOD_LABELS[entry.payment.method];
    return { ...base, subtitle: when, detail: method, badge: entry.payment.reversed ? { label: 'REVERTIDO', kind: 'neutral' } : null, trailing: formatCop(entry.payment.amount) };
  }
  const promised = entry.outcome === 'RESCHEDULED' && entry.promisedDate ? ` al ${formatShortDate(entry.promisedDate)}` : '';
  return { ...base, subtitle: when, detail: `${OUTCOME_LABELS[entry.outcome]}${promised}`, badge: null, trailing: '' };
}

/** Total cobrado en lo ya cargado, sin contar pagos revertidos. */
export function totalCollected(entries: readonly ReportEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.payment && !entry.payment.reversed ? entry.payment.amount : 0), 0);
}
