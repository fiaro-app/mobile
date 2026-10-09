import { useMemo } from 'react';
import { useMarkRead, useNotificationList } from '@/features/notifications/hooks/use-notifications';
import { toRowModel, type NotificationRowModel, type NotificationTarget } from '@/features/notifications/lib/notification-view-model';
import { failureOf } from '@/lib/http/api-failure-error';

/** Todo lo que la bandeja dibuja y puede hacer. */
export interface NotificationsScreen {
  readonly rows: NotificationRowModel[];
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly hasUnread: boolean;
  readonly refresh: () => void;
  readonly markAll: () => void;
  /** Marca como leída y devuelve la pantalla a la que debe ir la persona, si la hay. */
  readonly open: (row: NotificationRowModel) => NotificationTarget;
}

/** Lógica de la bandeja: lista, jalar para refrescar, "marcar todas" y abrir una (que la marca como leída). */
export function useNotificationsScreen(): NotificationsScreen {
  const list = useNotificationList();
  const { markOne, markAll } = useMarkRead();
  const rows = useMemo(() => (list.data ?? []).map((item) => toRowModel(item)), [list.data]);
  return {
    rows,
    loading: list.isPending,
    loadFailed: list.data === undefined && failureOf(list.error) !== null,
    refreshing: list.isFetching && list.data !== undefined,
    hasUnread: rows.some((row) => row.unread),
    refresh: () => {
      void list.refetch();
    },
    markAll,
    open: (row) => {
      if (row.unread) markOne(row.id);
      return row.target;
    },
  };
}
