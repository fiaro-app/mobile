import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';
import { isUpdateRequired, type MobileVersion } from '@/features/system/lib/version';

/**
 * Lo que impide mostrar la app:
 * - `checking`: todavía se está consultando al API.
 * - `ok`: se puede continuar.
 * - `offline` / `maintenance` / `update-required`: pantalla de bloqueo con su acción.
 */
export type GateStatus = 'checking' | 'ok' | 'offline' | 'maintenance' | 'update-required';

/**
 * Traduce el resultado de `GET /mobile/version` al estado de la puerta de entrada. Un error HTTP
 * que no es mantenimiento (por ejemplo 500) se trata como "sin conexión": para quien cobra en
 * campo el efecto es el mismo (no se puede validar la versión) y la acción también (reintentar).
 *
 * @param result - Resultado de la consulta, o `null` mientras no ha terminado.
 * @param installedVersion - Versión de la app instalada (`app.json`).
 */
export function resolveGateStatus(
  result: Result<MobileVersion, ApiFailure> | null,
  installedVersion: string,
): GateStatus {
  if (!result) return 'checking';
  if (result.ok) return isUpdateRequired(installedVersion, result.value) ? 'update-required' : 'ok';
  return result.failure.kind === 'maintenance' ? 'maintenance' : 'offline';
}
