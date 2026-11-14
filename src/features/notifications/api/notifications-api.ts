import { z } from 'zod';
import { NotificationSchema, NotificationsPageSchema, UnreadCountSchema, type AppNotification } from '@/features/notifications/lib/notification-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

const ClearedSchema = z.object({ deleted: z.number() });

type Response<T> = Promise<Result<T, ApiFailure>>;

/** Tamaño de página de la bandeja: lo reciente cabe de sobra; las más viejas rara vez se necesitan en campo. */
export const PAGE_SIZE = 50;

/** `QUERY /notifications`: las más recientes primero (el API las ordena así). */
export function fetchNotifications(): Response<AppNotification[]> {
  return authedRequest('/notifications', (body) => NotificationsPageSchema.parse(body).data, {
    method: 'QUERY',
    body: { page: 1, pageSize: PAGE_SIZE },
  });
}

/** `GET /notifications/unread-count`: cuántas faltan por leer (el globo de la campana). */
export function fetchUnreadCount(): Response<number> {
  return authedRequest('/notifications/unread-count', (body) => UnreadCountSchema.parse(body).count);
}

/** `POST /notifications/:id/read`: marca una como leída. */
export function markRead(id: string): Response<AppNotification> {
  return authedRequest(`/notifications/${id}/read`, (body) => NotificationSchema.parse(body), { method: 'POST', body: {} });
}

/** `POST /notifications/read-all`: marca todas como leídas. */
export function markAllRead(): Response<unknown> {
  return authedRequest('/notifications/read-all', (body) => body, { method: 'POST', body: {} });
}

/** `DELETE /notifications/:id`: borra una notificación propia (responde 204). */
export function deleteNotification(id: string): Response<unknown> {
  return authedRequest(`/notifications/${id}`, (body) => body, { method: 'DELETE' });
}

/** `POST /notifications/clear`: borra de una vez las propias, solo las leídas o todas; devuelve cuántas borró. */
export function clearNotifications(onlyRead: boolean): Response<number> {
  return authedRequest('/notifications/clear', (body) => ClearedSchema.parse(body).deleted, { method: 'POST', body: { onlyRead } });
}

/** `POST /push-tokens`: registra el token de Expo del teléfono para la persona de la sesión (responde 204). */
export function registerPushToken(token: string): Response<unknown> {
  return authedRequest('/push-tokens', (body) => body, { method: 'POST', body: { token } });
}

/** `POST /push-tokens/revoke`: desvincula el token (al cerrar sesión, para que nadie más reciba los avisos). */
export function revokePushToken(token: string): Response<unknown> {
  return authedRequest('/push-tokens/revoke', (body) => body, { method: 'POST', body: { token } });
}
