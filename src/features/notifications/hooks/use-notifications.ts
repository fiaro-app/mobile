import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchNotifications, fetchUnreadCount, markAllRead, markRead } from '@/features/notifications/api/notifications-api';
import type { AppNotification } from '@/features/notifications/lib/notification-schemas';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

const LIST_KEY = ['notifications', 'list'] as const;
const COUNT_KEY = ['notifications', 'unread-count'] as const;

function check<T>(result: Result<T, ApiFailure>): T {
  if (!result.ok) signOutIfSessionExpired(result.failure);
  return unwrapOrThrow(result);
}

/** Cuántas notificaciones faltan por leer. Se refresca cada minuto mientras la app está abierta. */
export function useUnreadCount() {
  return useQuery<number>({ queryKey: COUNT_KEY, queryFn: async () => check(await fetchUnreadCount()), staleTime: 30_000, refetchInterval: 60_000 });
}

/** La bandeja (las más recientes primero). */
export function useNotificationList() {
  return useQuery<AppNotification[]>({ queryKey: LIST_KEY, queryFn: async () => check(await fetchNotifications()), staleTime: 15_000 });
}

/** Marcar una o todas como leídas; en ambos casos se vuelve a pedir la bandeja y el conteo. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: LIST_KEY }), queryClient.invalidateQueries({ queryKey: COUNT_KEY })]);
  const one = useMutation({ mutationFn: async (id: string) => check(await markRead(id)), onSettled: refresh });
  const all = useMutation({ mutationFn: async () => check(await markAllRead()), onSettled: refresh });
  return { markOne: (id: string) => { one.mutate(id); }, markAll: () => { all.mutate(); } };
}
