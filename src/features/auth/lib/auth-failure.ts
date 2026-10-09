import type { ApiFailure } from '@/lib/http/failure';

/** Por qué no se pudo iniciar sesión, en los términos que la pantalla necesita mostrar. */
export type SignInFailure =
  | { readonly kind: 'invalid-credentials' }
  | { readonly kind: 'locked'; readonly retryAfterMinutes: number | null }
  | { readonly kind: 'deactivated' }
  | { readonly kind: 'rate-limited' }
  | { readonly kind: 'offline' }
  | { readonly kind: 'maintenance' }
  | { readonly kind: 'unknown' };

/** Por qué no se pudo cambiar la contraseña. */
export type ChangePasswordFailure =
  | { readonly kind: 'wrong-current' }
  | { readonly kind: 'weak' }
  | { readonly kind: 'invalid-length' }
  | { readonly kind: 'session-expired' }
  | { readonly kind: 'rate-limited' }
  | { readonly kind: 'offline' }
  | { readonly kind: 'maintenance' }
  | { readonly kind: 'unknown' };

function secondsToMinutes(seconds: number | null): number | null {
  return seconds === null ? null : Math.max(1, Math.ceil(seconds / 60));
}

/**
 * Traduce un fallo del API al de inicio de sesión. Se reacciona al `code` estable del contrato
 * (`INVALID_PHONE_NUMBER_OR_PASSWORD`, `SIGN_IN_LOCKED`, `ACCOUNT_DEACTIVATED`), nunca al texto del
 * mensaje: el API lo traduce y puede cambiarlo.
 */
export function toSignInFailure(failure: ApiFailure): SignInFailure {
  if (failure.kind !== 'http') return { kind: failure.kind };
  switch (failure.code) {
    case 'INVALID_PHONE_NUMBER_OR_PASSWORD':
      return { kind: 'invalid-credentials' };
    case 'SIGN_IN_LOCKED':
      return { kind: 'locked', retryAfterMinutes: secondsToMinutes(failure.retryAfterSeconds) };
    case 'ACCOUNT_DEACTIVATED':
      return { kind: 'deactivated' };
    default:
      return failure.status === 429 ? { kind: 'rate-limited' } : { kind: 'unknown' };
  }
}

/** Traduce un fallo del API al de cambio de contraseña. */
export function toChangePasswordFailure(failure: ApiFailure): ChangePasswordFailure {
  if (failure.kind !== 'http') return { kind: failure.kind };
  switch (failure.code) {
    case 'INVALID_PASSWORD':
      return { kind: 'wrong-current' };
    case 'PASSWORD_TOO_WEAK':
      return { kind: 'weak' };
    case 'INVALID_PASSWORD_LENGTH':
    case 'VALIDATION_FAILED':
      return { kind: 'invalid-length' };
    case 'UNAUTHORIZED':
    case 'UNAUTHENTICATED':
      return { kind: 'session-expired' };
    default:
      if (failure.status === 401) return { kind: 'session-expired' };
      return failure.status === 429 ? { kind: 'rate-limited' } : { kind: 'unknown' };
  }
}
