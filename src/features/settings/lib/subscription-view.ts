import type { Subscription } from '@/features/settings/lib/settings-schemas';
import { formatShortDate } from '@/lib/business-date';

/** Se avisa cuando faltan estos días o menos de la prueba. */
export const WARN_FROM_DAYS = 7;

/** Aviso del plan: ámbar (por vencer o en gracia) o rojo (solo lectura). */
export interface SubscriptionNotice {
  readonly kind: 'warning' | 'error';
  readonly message: string;
}

function days(count: number): string {
  return count === 1 ? '1 día' : `${String(count)} días`;
}

/** Aviso a mostrar según el plan, o `null` si no hay nada que avisar (activo y con tiempo). */
export function subscriptionNotice(subscription: Subscription): SubscriptionNotice | null {
  if (subscription.isReadOnly || subscription.status === 'READ_ONLY') {
    return { kind: 'error', message: 'Tu negocio está en modo de solo lectura: puedes consultar tus datos, pero no hacer cambios.' };
  }
  if (subscription.status === 'GRACE_PERIOD') {
    return { kind: 'warning', message: `Tu prueba terminó. Tienes ${days(subscription.graceDaysRemaining)} para activar tu plan antes de pasar a solo lectura.` };
  }
  if (subscription.daysRemaining <= WARN_FROM_DAYS) {
    return { kind: 'warning', message: subscription.daysRemaining === 0 ? 'Tu prueba gratis termina hoy.' : `Tu prueba gratis termina en ${days(subscription.daysRemaining)}.` };
  }
  return null;
}

/** Bloque "Tu plan" de Configuración. */
export interface SubscriptionView {
  readonly rows: readonly { readonly label: string; readonly value: string }[];
  readonly collectorsPercent: number;
  readonly notice: SubscriptionNotice | null;
}

const STATUS_LABELS = { ACTIVE: 'Activo', GRACE_PERIOD: 'En gracia', READ_ONLY: 'Solo lectura' } as const;

/** Convierte el plan del API en filas de lectura y el uso de cobradores en porcentaje. */
export function toSubscriptionView(subscription: Subscription): SubscriptionView {
  const { usage, limits } = subscription;
  return {
    rows: [
      { label: 'Plan', value: subscription.planCode === 'TRIAL' ? 'Prueba gratis' : subscription.planCode },
      { label: 'Estado', value: STATUS_LABELS[subscription.status] },
      { label: 'Vence el', value: formatShortDate(subscription.currentPeriodEndsAt) },
      { label: 'Días restantes', value: String(subscription.daysRemaining) },
      { label: 'Cobradores activos', value: `${String(usage.activeCollectors)} de ${String(limits.maxCollectors)}` },
    ],
    collectorsPercent: limits.maxCollectors === 0 ? 0 : Math.min(100, Math.round((usage.activeCollectors / limits.maxCollectors) * 100)),
    notice: subscriptionNotice(subscription),
  };
}
