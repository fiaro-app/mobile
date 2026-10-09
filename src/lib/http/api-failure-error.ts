import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/**
 * Error que envuelve un `ApiFailure` para poder lanzarlo desde la función de una query de TanStack.
 * Se lanza (en vez de guardar el fallo como dato) para que la query CONSERVE el último dato bueno:
 * un refresco sin red no debe borrar lo que ya se ve.
 */
export class ApiFailureError extends Error {
  constructor(readonly failure: ApiFailure) {
    super('api-request-failed');
  }
}

/** Devuelve el valor de un `Result` o lanza `ApiFailureError` con su fallo. */
export function unwrapOrThrow<T>(result: Result<T, ApiFailure>): T {
  if (result.ok) return result.value;
  throw new ApiFailureError(result.failure);
}

/** Saca el `ApiFailure` de lo que devolvió una query (`query.error`), o `null` si no es de este tipo. */
export function failureOf(error: unknown): ApiFailure | null {
  return error instanceof ApiFailureError ? error.failure : null;
}
