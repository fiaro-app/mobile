import { apiGet } from '@/lib/http/api-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';
import { MobileVersionSchema, type MobileVersion } from '@/features/system/lib/version';

/**
 * Pide al API la versión mínima soportada y la más reciente de la app (`GET /mobile/version`,
 * sin sesión: la app lo consulta antes de mostrar cualquier pantalla).
 */
export function fetchMobileVersion(): Promise<Result<MobileVersion, ApiFailure>> {
  return apiGet('/mobile/version', (body) => MobileVersionSchema.parse(body));
}
