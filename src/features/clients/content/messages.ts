import type { ApiFailure } from '@/lib/http/failure';
import type { ClientFilter } from '@/features/clients/lib/client-view-model';

/** Textos de los clientes (lista, registro, edición y ficha). */
export const CLIENTS_COPY = {
  title: 'Clientes',
  searchPlaceholder: 'Buscar por nombre o cédula',
  filters: [
    { value: 'all', label: 'Todos' },
    { value: 'current', label: 'Al día' },
    { value: 'arrears', label: 'En mora' },
  ] satisfies readonly { value: ClientFilter; label: string }[],
  register: 'Registrar cliente',
  emptyTitle: 'Aún no tienes clientes',
  emptyMessage: 'Registra a tu primer cliente para crearle un préstamo.',
  noResultsTitle: 'Sin resultados',
  noResultsMessage: 'No encontramos clientes con esa búsqueda. Prueba con otro nombre o cédula.',
  loadFailedTitle: 'No pudimos cargar los clientes',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
  loadingMore: 'Cargando más…',
  form: {
    registerIntro: 'Completa los datos del cliente.',
    editTitle: 'Editar cliente',
    name: 'Nombre completo',
    namePlaceholder: 'Ej: Marta Gómez',
    nationalId: 'Cédula',
    nationalIdPlaceholder: '1.020.304.050',
    phone: 'Teléfono',
    phonePlaceholder: '300 123 4567',
    occupation: 'Oficio',
    occupationPlaceholder: 'Ej: Comerciante',
    address: 'Dirección',
    addressPlaceholder: 'Ej: Cra 15 #82-10, Bogotá',
    cancel: 'Cancelar',
    submit: 'Registrar cliente',
    save: 'Guardar cambios',
    saved: 'Cambios guardados.',
    nothingToSave: 'No hay cambios por guardar.',
  },
  profile: {
    title: 'Ficha del cliente',
    phone: 'Teléfono',
    address: 'Dirección',
    occupation: 'Oficio',
    call: 'Llamar',
    edit: 'Editar cliente',
    loans: 'Préstamos',
    noLoans: 'Este cliente todavía no tiene préstamos.',
    newLoan: 'Nuevo préstamo',
    notFoundTitle: 'Cliente no encontrado',
    notFoundMessage: 'Ese cliente ya no existe. Vuelve a la lista y actualiza.',
    loadFailedTitle: 'No pudimos cargar al cliente',
    cannotCall: 'Este dispositivo no puede hacer llamadas.',
  },
} as const;

/** Mensaje de un fallo al administrar clientes, según el `code` estable del API. */
export function clientFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'CLIENT_NATIONAL_ID_TAKEN':
      return 'Ya tienes un cliente con esa cédula.';
    case 'FORBIDDEN':
      return 'No tienes permiso para administrar clientes.';
    case 'SUBSCRIPTION_READ_ONLY':
      return 'Tu suscripción está en modo de solo lectura. Renuévala para hacer cambios.';
    case 'NOT_FOUND':
      return 'Ese cliente ya no existe. Actualiza la lista.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
