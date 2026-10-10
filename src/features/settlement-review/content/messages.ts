import type { ApiFailure } from '@/lib/http/failure';
import type { SettlementStatus } from '@/features/settlement/lib/settlement-schemas';

/** Textos de la revisión de cuadres. */
export const REVIEW_COPY = {
  title: 'Cuadres',
  filters: [
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aprobados' },
    { value: 'REJECTED', label: 'Rechazados' },
  ] satisfies readonly { value: SettlementStatus; label: string }[],
  emptyTitle: 'No hay cuadres',
  emptyMessage: 'Cuando un cobrador envíe su cuadre aparecerá aquí.',
  loadFailedTitle: 'No pudimos cargar los cuadres',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  detail: {
    title: 'Detalle de cuadre',
    collectorNote: 'Nota del cobrador',
    reviewNote: 'Tu comentario',
    approve: 'Aprobar cuadre',
    reject: 'Rechazar cuadre',
    approveTitle: '¿Aprobar el cuadre?',
    rejectTitle: '¿Rechazar el cuadre?',
    rejectMessage: 'El cobrador verá tu comentario y podrá corregirlo y reenviarlo.',
    commentLabel: 'Comentario (opcional)',
    cancel: 'Cancelar',
    approveConfirm: 'Aprobar',
    rejectConfirm: 'Rechazar',
    approved: 'Cuadre aprobado.',
    rejected: 'Cuadre rechazado.',
    notFoundTitle: 'Cuadre no encontrado',
    notFoundMessage: 'Ese cuadre ya no existe. Vuelve a la lista.',
    loadFailedTitle: 'No pudimos cargar el cuadre',
  },
} as const;

/** Mensaje de un fallo al revisar un cuadre, según el `code` estable del API. */
export function reviewFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'CONFLICT':
      return 'Este cuadre ya fue revisado. Actualiza para ver su estado.';
    case 'FORBIDDEN':
      return 'No tienes permiso para revisar cuadres.';
    case 'SUBSCRIPTION_READ_ONLY':
      return 'Tu suscripción está en modo de solo lectura. Renuévala para hacer cambios.';
    case 'NOT_FOUND':
      return 'Ese cuadre ya no existe. Vuelve a la lista.';
    case 'VALIDATION_FAILED':
      return 'El comentario no es válido. Acórtalo e inténtalo de nuevo.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
