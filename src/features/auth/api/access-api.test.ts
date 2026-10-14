import { registerOwner, requestPasswordReset, resetPassword } from '@/features/auth/api/access-api';
import { apiPost } from '@/lib/http/api-request';

jest.mock('@/lib/http/api-request', () => ({ apiPost: jest.fn() }));

const post = jest.mocked(apiPost);

beforeEach(() => {
  jest.clearAllMocks();
  post.mockResolvedValue({ ok: true, value: null });
});

describe('access-api', () => {
  it('pide el código con el celular en E.164', async () => {
    await requestPasswordReset('300 123 4567');
    expect(post.mock.calls[0]?.[0]).toBe('/auth/request-password-reset');
    expect(post.mock.calls[0]?.[1]).toEqual({ phoneNumber: '+573001234567' });
  });

  it('pide el código con el token de Turnstile cuando lo hay', async () => {
    await requestPasswordReset('300 123 4567', 'tok');
    expect(post.mock.calls[0]?.[1]).toEqual({ phoneNumber: '+573001234567', turnstileToken: 'tok' });
  });

  it('canjea el código', async () => {
    await resetPassword({ phone: '3001234567', code: '123456', newPassword: 'nueva-clave' });
    expect(post.mock.calls[0]).toMatchObject(['/auth/reset-password', { phoneNumber: '+573001234567', code: '123456', newPassword: 'nueva-clave' }, expect.any(Function)]);
    expect((post.mock.calls[0]?.[2] as (b: unknown) => unknown)({ a: 1 })).toEqual({ a: 1 });
  });

  it('registra normalizando cédula y celular, sin correo vacío', async () => {
    const base = { phone: '300 123 4567', fullName: 'Daniel Rojas', password: 'clave-larga', nationalId: '1.020.304.050', businessName: 'El Águila', contactEmail: '' };
    await registerOwner(base);
    await registerOwner({ ...base, contactEmail: 'd@correo.com' });
    expect(post.mock.calls[0]?.[1]).toEqual({ phone: '+573001234567', fullName: 'Daniel Rojas', password: 'clave-larga', nationalId: '1020304050', businessName: 'El Águila' });
    expect(post.mock.calls[1]?.[1]).toMatchObject({ contactEmail: 'd@correo.com' });
  });

  it('envía el token de Turnstile solo cuando lo hay', async () => {
    const base = { phone: '3001234567', fullName: 'Daniel Rojas', password: 'clave-larga', nationalId: '1020304050', businessName: 'El Águila', contactEmail: '' };
    await registerOwner({ ...base, turnstileToken: 'tok' });
    await registerOwner({ ...base, turnstileToken: undefined });
    expect(post.mock.calls[0]?.[1]).toMatchObject({ turnstileToken: 'tok' });
    expect(post.mock.calls[1]?.[1]).not.toHaveProperty('turnstileToken');
  });
});
