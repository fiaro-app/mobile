/**
 * Por qué falló una petición al API, ya clasificado para que la interfaz reaccione sin mirar
 * códigos HTTP:
 * - `offline`: no hubo respuesta (sin internet, servidor caído o tiempo agotado).
 * - `maintenance`: el API responde 503 `MAINTENANCE` (modo mantenimiento activado a propósito).
 * - `http`: el API respondió con un error; `code` es el código estable del contrato (la app
 *   reacciona al código, nunca al texto del mensaje).
 */
export type ApiFailure =
  | { readonly kind: 'offline' }
  | { readonly kind: 'maintenance' }
  | {
      readonly kind: 'http';
      readonly status: number;
      readonly code: string | null;
      readonly retryAfterSeconds: number | null;
    };

/** Falla por falta de conexión. */
export const OFFLINE_FAILURE: ApiFailure = { kind: 'offline' };

/** Interpreta la cabecera `Retry-After` en segundos (no soporta la forma de fecha HTTP). */
export function parseRetryAfter(header: string | null | undefined): number | null {
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null;
}

/**
 * Clasifica una respuesta de error del API.
 *
 * @param status - Código HTTP.
 * @param code - `code` del cuerpo de error, si lo había.
 * @param retryAfter - Valor de la cabecera `Retry-After`, si venía.
 */
export function classifyHttpFailure(
  status: number,
  code: string | null | undefined,
  retryAfter?: string | null,
): ApiFailure {
  if (status === 503 && code === 'MAINTENANCE') return { kind: 'maintenance' };
  return { kind: 'http', status, code: code ?? null, retryAfterSeconds: parseRetryAfter(retryAfter) };
}
