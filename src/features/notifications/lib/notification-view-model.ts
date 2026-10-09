import type { AppNotification, EntityType, Severity } from '@/features/notifications/lib/notification-schemas';
import { formatShortDate } from '@/lib/business-date';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Hace cuánto pasó algo, en palabras ("ahora", "hace 5 min", "hace 3 h", "ayer"); pasada una semana, la fecha corta.
 *
 * @param iso - Instante ISO de la notificación.
 * @param now - "Ahora", inyectable para probar.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const elapsed = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (elapsed < MINUTE) return 'ahora';
  if (elapsed < HOUR) return `hace ${String(Math.floor(elapsed / MINUTE))} min`;
  if (elapsed < DAY) return `hace ${String(Math.floor(elapsed / HOUR))} h`;
  if (elapsed < 2 * DAY) return 'ayer';
  if (elapsed < 7 * DAY) return `hace ${String(Math.floor(elapsed / DAY))} días`;
  return formatShortDate(iso);
}

/** Tono visual de cada severidad: ALERT rojo, WARNING ámbar, SUCCESS verde, INFO neutro/marca. */
export type NotificationTone = 'destructive' | 'warning' | 'success' | 'primary';

const TONES: Record<Severity, NotificationTone> = { ALERT: 'destructive', WARNING: 'warning', SUCCESS: 'success', INFO: 'primary' };

/** Pantalla a la que lleva tocar la notificación; `null` si todavía no hay pantalla para esa entidad. */
export type NotificationTarget = '/settlement' | null;

/**
 * Solo el cuadre tiene pantalla propia para el cobrador. Un préstamo o cliente necesitaría además el `clientId`
 * (la ruta de detalle lo pide) y el aviso solo trae el id del préstamo; membresías y suscripción son del prestamista.
 */
export function targetOf(entity: EntityType | null): NotificationTarget {
  return entity === 'DAILY_SETTLEMENT' ? '/settlement' : null;
}

/** Una fila de la bandeja, lista para dibujar. */
export interface NotificationRowModel {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly when: string;
  readonly unread: boolean;
  readonly tone: NotificationTone;
  readonly target: NotificationTarget;
}

/** Convierte una notificación del API en la fila de la bandeja. */
export function toRowModel(notification: AppNotification, now: Date = new Date()): NotificationRowModel {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    when: timeAgo(notification.createdAt, now),
    unread: notification.readAt === null,
    tone: TONES[notification.severity],
    target: targetOf(notification.relatedEntityType),
  };
}
