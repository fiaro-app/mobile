import { planLimitMessage } from '@/features/settings/content/plan-limit';
import type { ApiFailure } from '@/lib/http/failure';
import type { RequestStatus } from '@/features/loan-requests/lib/request-schemas';

/** Filtro de estado de la lista: un estado o todos. */
export type RequestStatusFilter = RequestStatus | 'ALL';

/** Textos de las solicitudes de préstamo (el cobrador las hace; el administrador las resuelve). */
export const REQUEST_COPY = {
  title: 'Solicitudes',
  form: {
    title: 'Sugerir un préstamo',
    intro: 'Escribe la cédula del cliente. Si ya es del negocio no tienes que registrarlo; si no, te pedimos sus datos. El administrador decide si lo acepta.',
    nationalId: 'Cédula del cliente',
    nationalIdPlaceholder: '1020304050',
    search: 'Buscar',
    searching: 'Buscando',
    existing: 'Este cliente ya es del negocio. Solo falta lo del préstamo.',
    unknown: 'No encontramos esa cédula. Escribe los datos del cliente nuevo.',
    clientSection: 'Datos del cliente nuevo',
    name: 'Nombre completo',
    namePlaceholder: 'Carlos Andrés Gómez',
    phone: 'Celular',
    phonePlaceholder: '300 123 4567',
    occupation: 'Oficio',
    occupationPlaceholder: 'Vendedor ambulante',
    address: 'Dirección',
    addressPlaceholder: 'Calle 45 # 12-30',
    loanSection: 'Condiciones del préstamo',
    submit: 'Enviar solicitud',
    cancel: 'Cancelar',
    hint: 'No ves el riesgo del cliente: el administrador lo revisa antes de decidir.',
  },
  sent: {
    title: 'Solicitud enviada',
    message: 'El administrador recibirá un aviso. Cuando la acepte o la rechace, te avisamos a ti.',
    back: 'Volver a la ruta',
  },
  filters: [
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'APPROVED', label: 'Aceptadas' },
    { value: 'REJECTED', label: 'Rechazadas' },
    { value: 'ALL', label: 'Todas' },
  ] satisfies readonly { value: RequestStatusFilter; label: string }[],
  emptyTitle: 'No hay solicitudes',
  emptyMessage: 'Cuando un cobrador sugiera un préstamo aparecerá aquí.',
  loadFailedTitle: 'No pudimos cargar las solicitudes',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  detail: {
    title: 'Solicitud de préstamo',
    rejectionReason: 'Motivo del rechazo',
    approve: 'Aceptar solicitud',
    reject: 'Rechazar solicitud',
    approveTitle: '¿Aceptar la solicitud?',
    approveMessage: 'Se crea el préstamo (y el cliente, si es nuevo) y se asigna al cobrador que lo sugirió.',
    rejectTitle: '¿Rechazar la solicitud?',
    rejectMessage: 'No se crea nada y el cobrador verá tu motivo.',
    commentLabel: 'Motivo (opcional)',
    cancel: 'Cancelar',
    approveConfirm: 'Aceptar',
    rejectConfirm: 'Rechazar',
    approved: 'Solicitud aceptada: el préstamo ya está creado y asignado.',
    rejected: 'Solicitud rechazada.',
    notFoundTitle: 'Solicitud no encontrada',
    notFoundMessage: 'Esa solicitud ya no existe. Vuelve a la lista.',
    loadFailedTitle: 'No pudimos cargar la solicitud',
  },
} as const;

/** Mensaje de un fallo al consultar, enviar o resolver una solicitud, según el `code` estable del API. */
export function requestFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'CONFLICT':
      return 'Esta solicitud ya fue resuelta, o ya existe un cliente con esa cédula. Actualiza para ver su estado.';
    case 'FORBIDDEN':
      return 'No tienes permiso para hacer esto.';
    case 'PLAN_LIMIT_REACHED':
      return planLimitMessage(failure, 'L004A');
    case 'SUBSCRIPTION_READ_ONLY':
      return 'Tu suscripción está en modo de solo lectura. Renuévala para hacer cambios.';
    case 'NOT_FOUND':
      return 'Esa solicitud ya no existe. Vuelve a la lista.';
    case 'VALIDATION_FAILED':
      return 'Revisa los datos: alguno no es válido.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
