import { resolveAccess, type AccessInput } from '@/features/auth/lib/access';

const user = { id: '1', fullName: 'Alejo Pérez', phone: '+573001234567', mustChangePassword: false };
const base: AccessInput = { ready: true, user, pinEnabled: false, unlocked: true, pinOfferPending: false };

describe('resolveAccess', () => {
  it('espera a que se restaure la sesión', () => {
    expect(resolveAccess({ ...base, ready: false })).toBe('booting');
  });

  it('sin persona va al login', () => {
    expect(resolveAccess({ ...base, user: null })).toBe('signed-out');
  });

  it('con PIN y sin desbloquear queda bloqueada, aun con contraseña temporal', () => {
    const locked = { ...base, pinEnabled: true, unlocked: false };
    expect(resolveAccess(locked)).toBe('locked');
    expect(resolveAccess({ ...locked, user: { ...user, mustChangePassword: true } })).toBe('locked');
  });

  it('la contraseña temporal va antes que la oferta de PIN', () => {
    const input = { ...base, user: { ...user, mustChangePassword: true }, pinOfferPending: true };
    expect(resolveAccess(input)).toBe('must-change-password');
  });

  it('ofrece el PIN una vez cambiada la contraseña', () => {
    expect(resolveAccess({ ...base, pinOfferPending: true })).toBe('offer-pin');
  });

  it('con todo en orden tiene acceso completo', () => {
    expect(resolveAccess(base)).toBe('signed-in');
    expect(resolveAccess({ ...base, pinEnabled: true })).toBe('signed-in');
  });
});
