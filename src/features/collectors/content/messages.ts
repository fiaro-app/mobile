import type { ApiFailure } from '@/lib/http/failure';
import type { CollectorStatusFilter } from '@/features/collectors/lib/collector-view-model';

/** Textos de los cobradores (listado, registro y gestión). */
export const COLLECTORS_COPY = {
  title: 'Cobradores',
  searchPlaceholder: 'Buscar cobrador',
  statusOptions: [
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'all', label: 'Todos' },
  ] satisfies readonly { value: CollectorStatusFilter; label: string }[],
  register: 'Registrar cobrador',
  emptyTitle: 'Aún no tienes cobradores',
  emptyMessage: 'Registra a tu primer cobrador para asignarle una ruta.',
  noResultsTitle: 'Sin resultados',
  noResultsMessage: 'No encontramos cobradores con esa búsqueda.',
  loadFailedTitle: 'No pudimos cargar los cobradores',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  forbiddenTitle: 'Sin permiso',
  forbiddenMessage: 'Solo quien administra el negocio puede ver a los cobradores.',
  form: {
    intro: 'Completa los datos del nuevo cobrador. Iniciará sesión con su número de teléfono.',
    name: 'Nombre completo',
    namePlaceholder: 'Ej: Carlos Ramírez',
    nationalId: 'Cédula',
    nationalIdPlaceholder: '1.020.304.050',
    phone: 'Teléfono',
    phonePlaceholder: '300 123 4567',
    email: 'Correo electrónico',
    emailPlaceholder: 'carlos.ramirez@correo.com',
    portfolio: 'Cartera asignada',
    portfolioPlaceholder: 'Elige una cartera',
    portfolioSheet: 'Cartera asignada',
    note: 'Se generará una contraseña temporal para que se la compartas (por ejemplo, por WhatsApp). Deberá cambiarla en su primer inicio de sesión.',
    cancel: 'Cancelar',
    submit: 'Registrar cobrador',
  },
  registered: {
    title: 'Cobrador registrado',
    message: (name: string) => `${name} ya puede iniciar sesión con su celular.`,
    passwordTitle: 'Contraseña temporal',
    passwordHint: 'Compártela con el cobrador. Solo se muestra una vez.',
    share: 'Compartir contraseña',
    existing: 'Esta persona ya tenía cuenta en Fiaro: usará su contraseña actual.',
    done: 'Listo',
    shareMessage: (name: string, phone: string, password: string) =>
      `Hola ${name}, ya puedes entrar a Fiaro con tu celular ${phone} y esta contraseña temporal: ${password}. Te pedirá cambiarla.`,
  },
  manage: {
    title: 'Gestionar cobrador',
    statsTitle: 'Desempeño',
    portfolio: 'Cartera',
    savePortfolio: 'Guardar cartera',
    portfolioSaved: 'Cartera actualizada.',
    resetPassword: 'Restablecer contraseña',
    resetTitle: '¿Restablecer la contraseña?',
    resetMessage: (name: string) => `Se generará una contraseña temporal para ${name}. Deberá cambiarla al iniciar sesión.`,
    resetConfirm: 'Restablecer',
    tempTitle: 'Contraseña temporal nueva',
    deactivate: 'Desactivar cobrador',
    deactivateTitle: '¿Desactivar al cobrador?',
    deactivateMessage: (name: string) => `${name} perderá el acceso de inmediato. Su historial se conserva.`,
    deactivateConfirm: 'Desactivar',
    deactivated: 'Cobrador desactivado.',
    handoverTitle: 'Pasar sus préstamos a',
    handoverMessage: (name: string, count: number) =>
      count === 1
        ? `${name} tiene 1 préstamo activo. Elige a qué cobrador pasarlo: ningún préstamo puede quedar sin cobrador.`
        : `${name} tiene ${String(count)} préstamos activos. Elige a qué cobrador pasarlos: ningún préstamo puede quedar sin cobrador.`,
    noDestinations: 'No hay otro cobrador activo que pueda recibir sus préstamos. Registra o reactiva uno antes de darlo de baja.',
    handoverFailed: 'No pudimos revisar sus préstamos. Intenta de nuevo.',
    reactivate: 'Reactivar cobrador',
    reactivateTitle: '¿Reactivar al cobrador?',
    reactivateMessage: (name: string) => `${name} vuelve a ingresar con su misma cartera y ocupa un cupo de tu plan. Sus préstamos se asignan aparte.`,
    reactivateConfirm: 'Reactivar',
    reactivated: 'Cobrador reactivado.',
    remove: 'Borrar cobrador',
    removeTitle: '¿Borrar al cobrador?',
    removeMessage: (name: string) => `Solo se puede si ${name} nunca tuvo préstamos asignados, cobros ni cuadres (un registro por error). No se puede deshacer.`,
    removeConfirm: 'Borrar',
    inactiveNote: 'Este cobrador está desactivado y no puede iniciar sesión.',
    selfNote: 'Eres tú. Tu contraseña la cambias desde Perfil, y tu cartera o tu baja, otra persona que administre el negocio.',
    cancel: 'Cancelar',
    notFoundTitle: 'Cobrador no encontrado',
    notFoundMessage: 'Ese cobrador ya no existe. Vuelve a la lista y actualiza.',
  },
} as const;

/** Mensaje para un fallo al administrar cobradores, según el `code` estable del API. */
export function collectorFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'FORBIDDEN':
      return 'No tienes permiso para administrar cobradores.';
    case 'SUBSCRIPTION_READ_ONLY':
      return 'Tu suscripción está en modo de solo lectura. Renuévala para hacer cambios.';
    case 'NOT_FOUND':
      return 'Ese cobrador ya no existe. Actualiza la lista.';
    case 'CONFLICT':
      return 'Esa persona ya trabaja con tu negocio.';
    case 'COLLABORATOR_NATIONAL_ID_TAKEN':
      return 'Ya hay un colaborador con esa cédula en tu negocio.';
    case 'PLAN_LIMIT_REACHED':
      return 'Tu plan ya no tiene cupos de cobrador. Da de baja a uno o mejora tu plan.';
    case 'COLLECTOR_HAS_HISTORY':
      return 'Este cobrador ya tiene historial: dalo de baja en lugar de borrarlo.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
