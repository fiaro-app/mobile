import type { ClientDetailState } from '@/features/client-detail/hooks/use-client-detail';

/** Textos del detalle de cliente. */
export const DETAIL_COPY = {
  title: 'Cliente',
  historyTitle: 'Historial de pagos',
  historyEmpty: 'Todavía no hay visitas registradas.',
  call: 'Llamar',
  register: 'Registrar visita',
  labels: { phone: 'Teléfono', address: 'Dirección', balance: 'Saldo actual', overdue: 'Días de mora', nextVisit: 'Próxima visita' },
} as const;

/** Contenido de la pantalla cuando el detalle no se pudo cargar. */
export interface DetailEmpty {
  readonly icon: 'cloud-offline-outline' | 'construct-outline' | 'alert-circle-outline';
  readonly title: string;
  readonly message: string;
}

/** Qué mostrar según el fallo de carga (el estado `loading` y `ready` no usan esto). */
export function detailEmptyFor(state: ClientDetailState): DetailEmpty {
  if (state === 'offline') return { icon: 'cloud-offline-outline', title: 'Sin conexión', message: 'No pudimos cargar al cliente. Revisa tu conexión e intenta de nuevo.' };
  if (state === 'maintenance') return { icon: 'construct-outline', title: 'Estamos en mantenimiento', message: 'Vuelve a intentarlo en unos minutos.' };
  return { icon: 'alert-circle-outline', title: 'No pudimos cargar al cliente', message: 'Revisa tu conexión e intenta de nuevo.' };
}
