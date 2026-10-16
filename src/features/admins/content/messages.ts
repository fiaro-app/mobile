import type { ApiFailure } from '@/lib/http/failure';

/** Textos de la gestión de administradores. */
export const ADMINS_COPY = {
  title: 'Administradores',
  invite: 'Invitar administrador',
  promote: 'Subir de rango a un colaborador',
  promoteSheet: 'Elige a quién subir de rango',
  promoteNone: 'Todos tus colaboradores activos ya son administradores.',
  emptyTitle: 'No hay administradores',
  emptyMessage: 'Invita a alguien o sube de rango a un colaborador.',
  loadFailedTitle: 'No pudimos cargar los administradores',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  forbiddenTitle: 'No tienes acceso a esta sección',
  forbiddenMessage: 'Solo quien administra el negocio puede ver y cambiar a los administradores.',
  confirm: {
    promote: { title: '¿Hacer administrador?', message: (name: string) => `${name} podrá administrar el negocio contigo. Si cobra, sigue cobrando.`, confirm: 'Hacer administrador' },
    demote: { title: '¿Quitar el rol de administrador?', message: (name: string) => `${name} sigue como cobrador, pero ya no podrá administrar el negocio.`, confirm: 'Quitar el rol' },
    remove: { title: '¿Quitar el acceso?', message: (name: string) => `${name} pierde el acceso de inmediato. Su historial se conserva.`, confirm: 'Quitar el acceso' },
    cancel: 'Cancelar',
  },
  notices: {
    promote: (name: string) => `${name} ahora es administrador.`,
    demote: (name: string) => `${name} ya no es administrador.`,
    remove: (name: string) => `${name} ya no tiene acceso al negocio.`,
  },
  form: {
    title: 'Invitar administrador',
    intro: 'Crea su acceso a Fiaro. Le entregarás una contraseña temporal que deberá cambiar al ingresar.',
    name: 'Nombre completo',
    namePlaceholder: 'Lucía Pardo',
    nationalId: 'Cédula',
    nationalIdPlaceholder: '1030405060',
    phone: 'Celular',
    phonePlaceholder: '300 123 4567',
    contactEmail: 'Correo electrónico',
    contactEmailPlaceholder: 'admin@correo.com',
    submit: 'Invitar administrador',
    cancel: 'Cancelar',
  },
  invited: {
    title: 'Administrador invitado',
    message: (name: string) => `${name} ya puede ingresar a Fiaro. Entrégale esta contraseña temporal: solo se muestra una vez.`,
    existing: 'Esa persona ya tenía una cuenta y ahora administra tu negocio. Ingresa con su contraseña de siempre.',
    passwordTitle: 'Contraseña temporal',
    passwordHint: 'Pídele que la cambie al ingresar.',
    share: 'Compartir',
    done: 'Listo',
    shareMessage: (name: string, phone: string, password: string) => `Hola ${name}, ya eres administrador en Fiaro. Ingresa con tu celular ${phone} y esta contraseña temporal: ${password}. Te pedirá cambiarla.`,
  },
} as const;

/** Mensaje de un fallo al invitar o cambiar a un administrador, según el `code` estable del API. */
export function adminFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'FORBIDDEN':
      return 'No tienes permiso para administrar administradores, o intentaste cambiar tu propio acceso.';
    case 'SUBSCRIPTION_READ_ONLY':
      return 'Tu suscripción está en modo de solo lectura. Renuévala para hacer cambios.';
    case 'NOT_FOUND':
      return 'Esa persona ya no existe. Actualiza la lista.';
    case 'CONFLICT':
      return 'Esa persona ya trabaja con tu negocio.';
    case 'COLLABORATOR_NATIONAL_ID_TAKEN':
      return 'Ya hay un colaborador con esa cédula en tu negocio.';
    case 'VALIDATION_FAILED':
      return 'No se puede cambiar el acceso del dueño del negocio.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
