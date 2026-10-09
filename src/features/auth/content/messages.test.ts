import { changePasswordFailureMessage, signInFailureMessage } from '@/features/auth/content/messages';

describe('signInFailureMessage', () => {
  it('usa el texto del diseño para credenciales inválidas', () => {
    expect(signInFailureMessage({ kind: 'invalid-credentials' })).toBe('Teléfono o contraseña incorrectos.');
  });

  it('concuerda el singular y el plural del bloqueo', () => {
    expect(signInFailureMessage({ kind: 'locked', retryAfterMinutes: 1 })).toContain('1 minuto.');
    expect(signInFailureMessage({ kind: 'locked', retryAfterMinutes: 15 })).toContain('15 minutos.');
    expect(signInFailureMessage({ kind: 'locked', retryAfterMinutes: null })).toContain('más tarde');
  });
});

describe('changePasswordFailureMessage', () => {
  it('explica una contraseña débil', () => {
    expect(changePasswordFailureMessage({ kind: 'weak' })).toContain('fácil de adivinar');
  });
});
