import type { PlanPayment } from '@/features/plan/api/plan-api';
import { formatShortDate } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';

/** Un plan que se ofrece, con lo mismo que muestra la web en «Plan y pagos». El precio que se cobra lo pone la API. */
export interface PlanOffer {
  readonly code: 'INDIVIDUAL' | 'PRO' | 'TEAM';
  readonly name: string;
  /** Pesos colombianos por mes. */
  readonly monthlyPrice: number;
  readonly tagline: string;
  readonly features: readonly string[];
}

/** Planes de pago. Si cambia un precio o un tope, cambia también en la web (`PLAN_OFFERS`) y en `PLAN_CATALOG` de la API. */
export const PLAN_OFFERS: readonly PlanOffer[] = [
  { code: 'INDIVIDUAL', name: 'Individual', monthlyPrice: 49_000, tagline: 'Para cobrar tú sola o con poco equipo.', features: ['1 administrador (tú)', '2 cobradores', '2 carteras', 'Hasta 20 préstamos activos', 'Estadísticas básicas'] },
  { code: 'PRO', name: 'Pro', monthlyPrice: 69_000, tagline: 'Para un negocio con equipo y varias zonas.', features: ['Hasta 3 administradores', 'Hasta 10 cobradores', '4 carteras', 'Préstamos activos sin tope', 'Estadísticas completas y PDF'] },
  { code: 'TEAM', name: 'Team', monthlyPrice: 149_000, tagline: 'Para varios negocios bajo una misma cuenta.', features: ['Hasta 3 negocios', '3 administradores por negocio', 'Cobradores sin tope', '10 carteras', 'Estadísticas consolidadas', 'Soporte prioritario'] },
];

const PLAN_NAMES: Record<string, string> = { INDIVIDUAL: 'Individual', PRO: 'Pro', TEAM: 'Team' };
const STATUS_LABELS: Record<string, { label: string; kind: 'good' | 'warning' | 'bad' | 'neutral' }> = {
  APPROVED: { label: 'APROBADO', kind: 'good' },
  PENDING: { label: 'PENDIENTE', kind: 'warning' },
  DECLINED: { label: 'RECHAZADO', kind: 'bad' },
  ERROR: { label: 'CON ERROR', kind: 'bad' },
  VOIDED: { label: 'ANULADO', kind: 'neutral' },
};
const METHOD_LABELS: Record<string, string> = { CARD: 'Tarjeta', PSE: 'PSE', NEQUI: 'Nequi', BANCOLOMBIA_TRANSFER: 'Bancolombia' };

/** Una fila del historial de pagos lista para dibujar. */
export interface PaymentRow {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly amount: string;
  readonly badge: { readonly label: string; readonly kind: 'good' | 'warning' | 'bad' | 'neutral' };
}

/** Convierte las órdenes del API en filas: plan, fecha, medio de pago, monto en pesos y estado. */
export function toPaymentRows(payments: readonly PlanPayment[]): PaymentRow[] {
  return payments.map((payment) => {
    const method = payment.paymentMethodType ? (METHOD_LABELS[payment.paymentMethodType] ?? payment.paymentMethodType) : null;
    return {
      id: payment.reference,
      title: `Plan ${PLAN_NAMES[payment.planCode] ?? payment.planCode}`,
      subtitle: [formatShortDate(payment.createdAt), method].filter(Boolean).join(' · '),
      amount: formatCop(payment.amountInCents / 100),
      badge: STATUS_LABELS[payment.status] ?? { label: payment.status, kind: 'neutral' },
    };
  });
}
