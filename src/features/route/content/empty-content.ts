import type { RouteViewState } from '@/features/route/lib/route-view';

/** Contenido de un estado vacío o de error de la lista. */
export interface EmptyContent {
  readonly icon: 'checkmark' | 'search' | 'cloud-offline-outline' | 'construct-outline' | 'alert-circle-outline' | 'lock-closed-outline';
  readonly title: string;
  readonly message: string;
  readonly actionLabel?: string;
}

const RETRY = 'Reintentar';

/**
 * Qué mostrar cuando la lista no tiene filas. `filtered` distingue "sin resultados" (hay filtros
 * activos) de "sin clientes asignados" (no hay nada que filtrar).
 *
 * @param state - Estado de la carga de la ruta.
 * @param filtered - `true` si hay búsqueda o filtros activos.
 */
export function emptyContentFor(state: RouteViewState, filtered: boolean): EmptyContent {
  switch (state) {
    case 'offline':
      return { icon: 'cloud-offline-outline', title: 'Sin conexión', message: 'No pudimos cargar tu ruta. Revisa tu conexión e intenta de nuevo.', actionLabel: RETRY };
    case 'maintenance':
      return { icon: 'construct-outline', title: 'Estamos en mantenimiento', message: 'Vuelve a intentarlo en unos minutos.', actionLabel: RETRY };
    case 'forbidden':
      return { icon: 'lock-closed-outline', title: 'Esta cuenta no cobra', message: 'Tu usuario no tiene el rol de cobrador. Habla con tu administrador.' };
    case 'error':
      return { icon: 'alert-circle-outline', title: 'No pudimos cargar tu ruta', message: 'Ocurrió un error inesperado. Intenta de nuevo.', actionLabel: RETRY };
    default:
      return filtered
        ? { icon: 'search', title: 'Sin resultados', message: 'Prueba con otro nombre o quita algún filtro.' }
        : { icon: 'checkmark', title: 'Sin clientes asignados hoy', message: 'Cuando tu Lender te asigne una ruta, aparecerá aquí.' };
  }
}
