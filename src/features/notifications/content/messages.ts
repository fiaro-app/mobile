/** Textos de la bandeja de notificaciones. */
export const NOTIFICATIONS_COPY = {
  title: 'Notificaciones',
  markAll: 'Marcar todas como leídas',
  delete: 'Borrar',
  deleteOne: { title: '¿Borrar esta notificación?', confirm: 'Borrar', cancel: 'Cancelar' },
  deleteMany: {
    title: 'Borrar notificaciones',
    message: 'Las de más de 90 días se borran solas. Esto no se puede deshacer.',
    read: 'Borrar las leídas',
    all: 'Borrar todas',
    cancel: 'Cancelar',
  },
  deleteHint: 'Mantén presionado para borrarla',
  emptyTitle: 'Sin notificaciones',
  emptyMessage: 'Aquí verás los avisos de tu prestamista y de tus cuadres.',
  loadFailedTitle: 'No pudimos cargar tus notificaciones',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  bellLabel: 'Notificaciones',
} as const;

/** Etiqueta accesible de la campana con el conteo de sin leer. */
export function bellLabel(unread: number): string {
  return unread > 0 ? `${NOTIFICATIONS_COPY.bellLabel}, ${String(unread)} sin leer` : NOTIFICATIONS_COPY.bellLabel;
}
