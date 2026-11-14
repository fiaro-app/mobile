import { authClient, STORAGE_PREFIX } from '@/features/auth/api/auth-client';
import { changePassword, restoreSession, signInWithPhone, signOut } from '@/features/auth/api/auth-api';
import { secureStorage } from '@/lib/storage/secure-storage';

jest.mock('@/features/auth/api/auth-client', () => ({
  STORAGE_PREFIX: 'fiaro',
  authClient: {
    signIn: { phoneNumber: jest.fn() },
    getSession: jest.fn(),
    changePassword: jest.fn(),
    signOut: jest.fn(),
  },
}));
jest.mock('@/lib/storage/secure-storage', () => ({
  secureStorage: { setItemAsync: jest.fn().mockResolvedValue(undefined) },
}));

const mockClient = jest.mocked(authClient, { shallow: false });
const mockStorage = jest.mocked(secureStorage);

const authUser = { id: 'u1', name: 'Ana Pérez', phoneNumber: '+573001234567', mustChangePassword: false };
const asUser = { id: 'u1', fullName: 'Ana Pérez', phone: '+573001234567', mustChangePassword: false, contactEmail: null, contactEmailVerified: false };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signInWithPhone', () => {
  it('devuelve la persona de la respuesta', async () => {
    mockClient.signIn.phoneNumber.mockResolvedValue({ data: { user: authUser }, error: null });
    expect(await signInWithPhone('+573001234567', 'clave')).toEqual({ ok: true, value: asUser });
    expect(mockClient.signIn.phoneNumber).toHaveBeenCalledWith(
      expect.objectContaining({ phoneNumber: '+573001234567', password: 'clave' }),
    );
  });

  it('clasifica un error HTTP con su código', async () => {
    mockClient.signIn.phoneNumber.mockResolvedValue({
      data: null,
      error: { status: 401, code: 'INVALID_PHONE_NUMBER_OR_PASSWORD' },
    });
    expect(await signInWithPhone('+573001234567', 'mala')).toEqual({
      ok: false,
      failure: { kind: 'http', status: 401, code: 'INVALID_PHONE_NUMBER_OR_PASSWORD', retryAfterSeconds: null },
    });
  });

  it('captura Retry-After desde las cabeceras del error', async () => {
    mockClient.signIn.phoneNumber.mockImplementation(
      async (...args: unknown[]) => {
        const options = args[0] as { fetchOptions?: { onError?: (context: unknown) => void } };
        options.fetchOptions?.onError?.({ response: { headers: { get: () => '900' } } });
        return { data: null, error: { status: 429, code: 'SIGN_IN_LOCKED' } };
      },
    );
    expect(await signInWithPhone('+573001234567', 'mala')).toMatchObject({
      failure: { code: 'SIGN_IN_LOCKED', retryAfterSeconds: 900 },
    });
  });

  it('un error sin estado o una excepción es "sin conexión"', async () => {
    mockClient.signIn.phoneNumber.mockResolvedValueOnce({ data: null, error: {} });
    expect(await signInWithPhone('+573001234567', 'x')).toEqual({ ok: false, failure: { kind: 'offline' } });
    mockClient.signIn.phoneNumber.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await signInWithPhone('+573001234567', 'x')).toEqual({ ok: false, failure: { kind: 'offline' } });
  });

  it('una respuesta sin persona válida es un fallo, no una excepción', async () => {
    mockClient.signIn.phoneNumber.mockResolvedValue({ data: { user: { id: 1 } }, error: null });
    expect(await signInWithPhone('+573001234567', 'x')).toMatchObject({ ok: false });
  });
});

describe('restoreSession', () => {
  it('sin sesión vigente devuelve null', async () => {
    mockClient.getSession.mockResolvedValue({ data: null, error: null });
    expect(await restoreSession()).toEqual({ ok: true, value: null });
  });

  it('con sesión devuelve la persona', async () => {
    mockClient.getSession.mockResolvedValue({ data: { session: {}, user: authUser }, error: null });
    expect(await restoreSession()).toEqual({ ok: true, value: asUser });
  });

  it('propaga el fallo de red', async () => {
    mockClient.getSession.mockRejectedValue(new Error('boom'));
    expect(await restoreSession()).toEqual({ ok: false, failure: { kind: 'offline' } });
  });
});

describe('changePassword', () => {
  it('manda las dos contraseñas y devuelve la persona actualizada', async () => {
    mockClient.changePassword.mockResolvedValue({ data: { user: { ...authUser } }, error: null });
    expect(await changePassword('temporal', 'nueva-clave-segura-1')).toEqual({ ok: true, value: asUser });
    expect(mockClient.changePassword).toHaveBeenCalledWith({ currentPassword: 'temporal', newPassword: 'nueva-clave-segura-1' });
  });

  it('devuelve el código cuando la contraseña es débil', async () => {
    mockClient.changePassword.mockResolvedValue({ data: null, error: { status: 400, code: 'PASSWORD_TOO_WEAK' } });
    expect(await changePassword('a', 'b')).toMatchObject({ failure: { code: 'PASSWORD_TOO_WEAK' } });
  });
});

describe('signOut', () => {
  it('borra la cookie local aunque el servidor no responda', async () => {
    mockClient.signOut.mockRejectedValue(new Error('offline'));
    await signOut();
    expect(mockStorage.setItemAsync).toHaveBeenCalledWith(`${STORAGE_PREFIX}_cookie`, '{}');
    expect(mockStorage.setItemAsync).toHaveBeenCalledWith(`${STORAGE_PREFIX}_session_data`, '{}');
  });
});
