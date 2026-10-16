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
    return { kind: 'error', message: 'Tu negocio está en modo de solo lectura: puedes consultar tus datos y seguir registrando cobros y cuadres, pero no hacer otros cambios.' };
  }
  const trial = subscription.planCode === 'TRIAL';
  if (subscription.status === 'GRACE_PERIOD') {
    const left = days(subscription.graceDaysRemaining);
    return {
      kind: 'warning',
      message: trial
        ? `Tu prueba terminó. Tienes ${left} para activar tu plan antes de pasar a solo lectura.`
        : `Tu plan venció. Tienes ${left} para renovarlo antes de pasar a solo lectura.`,
    };
  }
  if (subscription.daysRemaining <= WARN_FROM_DAYS) {
    const what = trial ? 'Tu prueba gratis termina' : 'Tu plan vence';
    return { kind: 'warning', message: subscription.daysRemaining === 0 ? `${what} hoy.` : `${what} en ${days(subscription.daysRemaining)}.` };
  }
  return null;
}

/** Una barra de uso de «Tu plan»: cuánto se usa de un tope. */
export interface UsageBar {
  readonly label: string;
  readonly value: string;
  readonly percent: number;
}

/** Bloque "Tu plan" de Configuración. */
export interface SubscriptionView {
  readonly rows: readonly { readonly label: string; readonly value: string }[];
  /** Cobradores, administradores y préstamos activos que tienen tope, cada uno con su barra. */
  readonly bars: readonly UsageBar[];
  /** Cuántas carteras admite el plan, la «General» incluida. */
  readonly maxPortfolios: number;
  readonly notice: SubscriptionNotice | null;
}

const STATUS_LABELS = { ACTIVE: 'Activo', GRACE_PERIOD: 'En gracia', READ_ONLY: 'Solo lectura' } as const;
const PLAN_LABELS = { TRIAL: 'Prueba gratis', INDIVIDUAL: 'Individual', PRO: 'Pro', TEAM: 'Team' } as const;

function percentOf(used: number, max: number): number {
  return max === 0 ? 0 : Math.min(100, Math.round((used / max) * 100));
}

function usageOf(used: number, max: number): string {
  return `${String(used)} de ${String(max)}`;
}

/** Convierte el plan del API en filas de lectura y el uso de cada tope en barras. */
export function toSubscriptionView(subscription: Subscription): SubscriptionView {
  const { usage, limits } = subscription;
  const bars: UsageBar[] = [
    { label: 'Cobradores activos', value: usageOf(usage.activeCollectors, limits.maxCollectors), percent: percentOf(usage.activeCollectors, limits.maxCollectors) },
    { label: 'Administradores', value: usageOf(usage.activeAdmins, limits.maxAdmins), percent: percentOf(usage.activeAdmins, limits.maxAdmins) },
  ];
  if (limits.maxActiveLoans !== null) {
    bars.push({ label: 'Préstamos activos', value: usageOf(usage.activeLoans, limits.maxActiveLoans), percent: percentOf(usage.activeLoans, limits.maxActiveLoans) });
  }
  return {
    rows: [
      { label: 'Plan', value: PLAN_LABELS[subscription.planCode] },
      { label: 'Estado', value: STATUS_LABELS[subscription.status] },
      { label: 'Vence el', value: formatShortDate(subscription.currentPeriodEndsAt) },
      { label: 'Días restantes', value: String(subscription.daysRemaining) },
      ...(limits.maxActiveLoans === null ? [{ label: 'Préstamos activos', value: `${String(usage.activeLoans)} (sin tope)` }] : []),
      { label: 'Carteras', value: `Hasta ${String(limits.maxPortfolios)}` },
    ],
    bars,
    maxPortfolios: limits.maxPortfolios,
    notice: subscriptionNotice(subscription),
  };
}
