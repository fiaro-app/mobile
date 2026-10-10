import type { ApiFailure } from '@/lib/http/failure';

/** Textos de Configuración. */
export const SETTINGS_COPY = {
  title: 'Configuración',
  business: { title: 'Tu negocio', name: 'Nombre de la financiera', save: 'Guardar nombre', saved: 'Nombre guardado.' },
  brand: { title: 'Color de marca', hint: 'Es el color de los botones en la app de tus cobradores y en la web.', save: 'Guardar color', saved: 'Color guardado.', reset: 'Usar el de Fiaro' },
  days: {
    title: 'Días sin cobro',
    hint: 'En estos días no se esperan cuotas: el calendario las pasa al siguiente día de cobro.',
    holidays: 'Tampoco cobrar en festivos nacionales de Colombia',
    save: 'Guardar días',
    saved: 'Días guardados.',
  },
  portfolios: {
    title: 'Carteras',
    hint: 'Agrupan a tus cobradores. La cartera por defecto no se puede borrar.',
    add: 'Agregar cartera',
    newName: 'Nombre de la cartera',
    create: 'Crear cartera',
    created: 'Cartera creada.',
    rename: 'Renombrar',
    renamed: 'Cartera renombrada.',
    delete: 'Borrar',
    deleted: 'Cartera borrada.',
    deleteTitle: '¿Borrar la cartera?',
    deleteMessage: (name: string) => `Se borrará la cartera "${name}". Esta acción no se puede deshacer.`,
    deleteConfirm: 'Borrar',
    cancel: 'Cancelar',
    defaultBadge: 'Por defecto',
    nameRequired: 'Escribe el nombre de la cartera.',
  },
  plan: { title: 'Tu plan' },
  loadFailedTitle: 'No pudimos cargar la configuración',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  nameInvalid: 'Escribe el nombre de tu financiera (2 a 120 caracteres).',
} as const;

/** Mensaje de un fallo al cambiar la configuración, según el `code` estable del API. */
export function settingsFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'CONFLICT':
      return 'Ya tienes una cartera con ese nombre.';
    case 'FORBIDDEN':
      return 'No tienes permiso para cambiar la configuración del negocio.';
    case 'SUBSCRIPTION_READ_ONLY':
      return 'Tu suscripción está en modo de solo lectura. Renuévala para hacer cambios.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos guardar los cambios. Intenta de nuevo.';
  }
}

/** Mensaje de un fallo al borrar una cartera (409 = por defecto o con cobradores activos). */
export function portfolioDeleteFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'http' && failure.code === 'CONFLICT') return 'No se puede borrar: es la cartera por defecto o todavía tiene cobradores activos. Reasígnalos y vuelve a intentarlo.';
  if (failure.kind === 'http' && failure.code === 'NOT_FOUND') return 'Esa cartera ya no existe. Actualiza la lista.';
  return settingsFailureMessage(failure);
}
