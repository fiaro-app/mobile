import { useMemo } from 'react';
import { useDeleteNotifications, useMarkRead, useNotificationList } from '@/features/notifications/hooks/use-notifications';
import { toRowModel, type NotificationRowModel, type NotificationTarget } from '@/features/notifications/lib/notification-view-model';
import { failureOf } from '@/lib/http/api-failure-error';

/** Todo lo que la bandeja dibuja y puede hacer. */
export interface NotificationsScreen {
  readonly rows: NotificationRowModel[];
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly hasUnread: boolean;
  readonly hasRead: boolean;
  readonly refresh: () => void;
  readonly markAll: () => void;
  /** Borra una notificación propia. */
  readonly remove: (row: NotificationRowModel) => void;
  /** Borra de una vez las leídas, o todas. */
  readonly clear: (onlyRead: boolean) => void;
  /** Marca como leída y devuelve la pantalla a la que debe ir la persona, si la hay. */
  readonly open: (row: NotificationRowModel) => NotificationTarget;
}

/** Lógica de la bandeja: lista, jalar para refrescar, "marcar todas", borrar (una, las leídas o todas) y abrir una (que la marca como leída). */
export function useNotificationsScreen(): NotificationsScreen {
  const list = useNotificationList();
  const { markOne, markAll } = useMarkRead();
  const { removeOne, clear } = useDeleteNotifications();
  const rows = useMemo(() => (list.data ?? []).map((item) => toRowModel(item)), [list.data]);
  return {
    rows,
    loading: list.isPending,
    loadFailed: list.data === undefined && failureOf(list.error) !== null,
    refreshing: list.isFetching && list.data !== undefined,
    hasUnread: rows.some((row) => row.unread),
    hasRead: rows.some((row) => !row.unread),
    refresh: () => {
      void list.refetch();
    },
    markAll,
    remove: (row) => {
      removeOne(row.id);
    },
    clear,
    open: (row) => {
      if (row.unread) markOne(row.id);
      return row.target;
    },
  };
}
