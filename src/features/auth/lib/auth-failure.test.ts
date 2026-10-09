import { toChangePasswordFailure, toSignInFailure } from '@/features/auth/lib/auth-failure';
import type { ApiFailure } from '@/lib/http/failure';

const http = (status: number, code: string | null, retryAfterSeconds: number | null = null): ApiFailure => ({
  kind: 'http',
  status,
  code,
  retryAfterSeconds,
});

describe('toSignInFailure', () => {
  it('propaga sin conexión y mantenimiento', () => {
    expect(toSignInFailure({ kind: 'offline' })).toEqual({ kind: 'offline' });
    expect(toSignInFailure({ kind: 'maintenance' })).toEqual({ kind: 'maintenance' });
  });

  it('reconoce credenciales inválidas', () => {
    expect(toSignInFailure(http(401, 'INVALID_PHONE_NUMBER_OR_PASSWORD'))).toEqual({ kind: 'invalid-credentials' });
  });

  it('convierte la espera del bloqueo a minutos redondeando hacia arriba', () => {
    expect(toSignInFailure(http(429, 'SIGN_IN_LOCKED', 900))).toEqual({ kind: 'locked', retryAfterMinutes: 15 });
    expect(toSignInFailure(http(429, 'SIGN_IN_LOCKED', 61))).toEqual({ kind: 'locked', retryAfterMinutes: 2 });
    expect(toSignInFailure(http(429, 'SIGN_IN_LOCKED', 5))).toEqual({ kind: 'locked', retryAfterMinutes: 1 });
    expect(toSignInFailure(http(429, 'SIGN_IN_LOCKED'))).toEqual({ kind: 'locked', retryAfterMinutes: null });
  });

  it('reconoce cuenta desactivada y límite por IP', () => {
    expect(toSignInFailure(http(403, 'ACCOUNT_DEACTIVATED'))).toEqual({ kind: 'deactivated' });
    expect(toSignInFailure(http(429, 'RATE_LIMITED'))).toEqual({ kind: 'rate-limited' });
  });

  it('lo demás es desconocido', () => {
    expect(toSignInFailure(http(500, null))).toEqual({ kind: 'unknown' });
  });
});

describe('toChangePasswordFailure', () => {
  it.each([
    [http(400, 'INVALID_PASSWORD'), 'wrong-current'],
    [http(400, 'PASSWORD_TOO_WEAK'), 'weak'],
    [http(400, 'INVALID_PASSWORD_LENGTH'), 'invalid-length'],
    [http(400, 'VALIDATION_FAILED'), 'invalid-length'],
    [http(401, 'UNAUTHORIZED'), 'session-expired'],
    [http(401, null), 'session-expired'],
    [http(429, null), 'rate-limited'],
    [http(500, null), 'unknown'],
    [{ kind: 'offline' } as ApiFailure, 'offline'],
    [{ kind: 'maintenance' } as ApiFailure, 'maintenance'],
  ])('%j -> %s', (failure, kind) => {
    expect(toChangePasswordFailure(failure).kind).toBe(kind);
  });
});
