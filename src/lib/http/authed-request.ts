import { authClient } from '@/features/auth/api/auth-client';
import { API_URL, APP_SCHEME, REQUEST_TIMEOUT_MS } from '@/lib/config';
import { classifyHttpFailure, OFFLINE_FAILURE, type ApiFailure } from '@/lib/http/failure';
import { readErrorBody } from '@/lib/http/read-error';
import { fail, ok, type Result } from '@/lib/result';
import { traceHeaders } from '@/lib/http/trace-headers';
import { Platform } from 'react-native';

/** Métodos que usa el API; `QUERY` es el de las búsquedas con cuerpo (ver `authedRequest`). */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'QUERY';

export interface AuthedRequestOptions {
  readonly method?: HttpMethod;
  readonly body?: unknown;
}

/** Cabeceras de sesión del dispositivo (cookie + esquema de la app); en web las pone el navegador. */
export async function sessionHeaders(): Promise<Record<string, string>> {
  if (Platform.OS === 'web') return {};
  const cookie = await authClient.getCookie();
  return { 'expo-origin': `${APP_SCHEME}://`, ...(cookie ? { cookie } : {}) };
}

/**
 * Petición con la sesión del dispositivo a una ruta del API que NO es de better-auth (cartera,
 * ruta del día, visitas...). Nunca lanza: devuelve `Result` con el fallo ya clasificado.
 *
 * Detalles que no son obvios:
 * - **Cookie a mano.** React Native no tiene "jar" de cookies; la que guardó `expoClient` se lee con
 *   `authClient.getCookie()` y se manda en la cabecera `cookie`, junto con `expo-origin` (el API
 *   compara ese esquema con `MOBILE_APP_SCHEMES`). En web (solo desarrollo) lo hace el navegador.
 * - **Método `QUERY`.** El API usa el método HTTP `QUERY` (búsqueda con cuerpo, sin efectos) en
 *   `/collectors/me/route`, `/lenders/me/stats`, etc. `fetch` de React Native lo acepta; si algún
 *   dispositivo lo rechazara, el fallo llegaría como `offline`: probar en dispositivo real.
 * - **Sin contenido (204).** Rutas como `POST /push-tokens` no devuelven cuerpo: `parse` recibe `null` y no se lee JSON.
 * - **Versión del API.** Sin cabecera `API-Version` el API sirve la versión 1, la actual.
 *
 * @param path - Ruta con barra inicial (`/collectors/me/route`).
 * @param parse - Valida y convierte el cuerpo JSON de la respuesta.
 */
export async function authedRequest<T>(
  path: string,
  parse: (body: unknown) => T,
  options: AuthedRequestOptions = {},
): Promise<Result<T, ApiFailure>> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    const hasBody = options.body !== undefined;
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: { ...(await sessionHeaders()), ...traceHeaders(), ...(hasBody ? { 'content-type': 'application/json' } : {}) },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      signal: controller.signal,
    });
    if (!response.ok) {
      const { code, errorCode } = await readErrorBody(response);
      return fail(classifyHttpFailure(response.status, code, response.headers.get('retry-after'), errorCode));
    }
    try {
      return ok(parse(response.status === 204 ? null : await response.json()));
    } catch {
      return fail(classifyHttpFailure(200, 'INVALID_RESPONSE'));
    }
  } catch {
    return fail(OFFLINE_FAILURE);
  } finally {
    clearTimeout(timer);
  }
}
