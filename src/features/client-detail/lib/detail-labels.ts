import type { LoanFrequency, PaymentMethod, VisitOutcome } from '@/features/client-detail/lib/detail-schemas';

/** Nombre del medio de pago, como lo muestra el diseño. */
export const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  NEQUI: 'Nequi',
  TRANSFER: 'Transferencia',
};

/** Resultado de una visita, en el historial. */
export const OUTCOME_LABELS: Record<VisitOutcome, string> = {
  PAID: 'Pagado',
  NOT_FOUND: 'No encontrado',
  REFUSED: 'Se negó',
  RESCHEDULED: 'Reprogramada',
};

const FREQUENCY_LABELS: Record<LoanFrequency, string> = {
  DAILY: 'diaria',
  WEEKLY: 'semanal',
  BIWEEKLY: 'quincenal',
  MONTHLY: 'mensual',
};

/** Etiqueta de la cuota según cada cuánto se cobra (`Cuota diaria`). */
export function installmentLabel(frequency: LoanFrequency): string {
  return `Cuota ${FREQUENCY_LABELS[frequency]}`;
}

/** Da formato de lectura a un celular E.164 colombiano (`+573001234567` → `+57 300 123 4567`); otro formato queda igual. */
export function formatPhone(e164: string): string {
  const match = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return match ? `+57 ${match[1] ?? ''} ${match[2] ?? ''} ${match[3] ?? ''}` : e164;
}
