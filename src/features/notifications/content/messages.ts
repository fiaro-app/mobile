/** Textos de la bandeja de notificaciones. */
export const NOTIFICATIONS_COPY = {
  title: 'Notificaciones',
  markAll: 'Marcar todas como leídas',
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
