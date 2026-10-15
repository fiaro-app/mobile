import { API_URL, REQUEST_TIMEOUT_MS } from '@/lib/config';
import { classifyHttpFailure, OFFLINE_FAILURE, type ApiFailure } from '@/lib/http/failure';
import { readErrorBody } from '@/lib/http/read-error';
import { traceHeaders } from '@/lib/http/trace-headers';
import { fail, ok, type Result } from '@/lib/result';

/**
 * GET sin sesión al API (las rutas de infraestructura: `/mobile/version`, `/health`). Las rutas con
 * sesión no pasan por aquí: las atiende el cliente de better-auth, que guarda y envía la cookie.
 *
 * Nunca lanza: un fallo de red, un tiempo agotado o un error HTTP vuelven como `ApiFailure`.
 *
 * @param path - Ruta con barra inicial (`/mobile/version`).
 * @param parse - Valida y convierte el cuerpo JSON; si lanza, el fallo es `http` con estado 200.
 */
export async function apiGet<T>(path: string, parse: (body: unknown) => T): Promise<Result<T, ApiFailure>> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, { headers: traceHeaders(), signal: controller.signal });
    if (!response.ok) {
      const { code, errorCode } = await readErrorBody(response);
      return fail(classifyHttpFailure(response.status, code, response.headers.get('retry-after'), errorCode));
    }
    try {
      return ok(parse(await response.json()));
    } catch {
      return fail(classifyHttpFailure(200, 'INVALID_RESPONSE'));
    }
  } catch {
    return fail(OFFLINE_FAILURE);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * `POST` con cuerpo JSON a una ruta pública del API (sin sesión): recuperar contraseña y registrarse. Igual que `apiGet`,
 * nunca lanza: devuelve el `Result` con el fallo ya clasificado. Una respuesta sin cuerpo (204) se pasa a `parse` como `null`.
 */
export async function apiPost<T>(path: string, body: unknown, parse: (body: unknown) => T): Promise<Result<T, ApiFailure>> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { ...traceHeaders(), 'content-type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
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
