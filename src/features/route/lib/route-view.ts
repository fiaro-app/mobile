import type { ApiFailure } from '@/lib/http/failure';
import type { RouteEntry } from '@/features/route/lib/route-entry';

/**
 * Lo que la pantalla de la ruta debe mostrar:
 * - `loading`: primera carga, sin datos todavía.
 * - `ready`: hay clientes.
 * - `empty`: el API respondió y no hay clientes asignados hoy.
 * - `forbidden`: la sesión no es de un cobrador (403).
 * - `offline` / `maintenance` / `error`: no se pudo cargar.
 */
export type RouteViewState = 'loading' | 'ready' | 'empty' | 'forbidden' | 'offline' | 'maintenance' | 'error';

/**
 * Traduce lo que hay (datos cargados y/o el último fallo) al estado de la pantalla. Si ya hay una
 * ruta cargada y un refresco falla, se sigue mostrando la que había: perder la lista por una falla
 * de red en campo sería peor que mostrarla un poco vieja.
 *
 * @param data - Última ruta cargada con éxito, o `undefined` si nunca cargó.
 * @param failure - Fallo de la última carga, o `null`.
 */
export function resolveRouteView(data: RouteEntry[] | undefined, failure: ApiFailure | null): RouteViewState {
  if (data) return data.length > 0 ? 'ready' : 'empty';
  if (!failure) return 'loading';
  if (failure.kind === 'offline') return 'offline';
  if (failure.kind === 'maintenance') return 'maintenance';
  return failure.status === 403 ? 'forbidden' : 'error';
}
