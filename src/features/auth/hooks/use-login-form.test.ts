import { act, renderHook } from '@testing-library/react-native';
import * as api from '@/features/auth/api/auth-api';
import { useLoginForm } from '@/features/auth/hooks/use-login-form';
import * as actions from '@/features/auth/store/session-actions';

jest.mock('@/features/auth/api/auth-api', () => ({ signInWithPhone: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ completeSignIn: jest.fn() }));

const signIn = jest.mocked(api.signInWithPhone);
const user = { id: '1', fullName: 'Ana Pérez', phone: '+573001234567', mustChangePassword: false };

async function fill(result: { current: ReturnType<typeof useLoginForm> }, phone: string, password: string) {
  await act(async () => {
    result.current.phone.onChangeText(phone);
    result.current.password.onChangeText(password);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useLoginForm', () => {
  it('da formato al celular mientras se escribe', async () => {
    const { result } = await renderHook(() => useLoginForm());
    await act(async () => {
      result.current.phone.onChangeText('3001234567');
    });
    expect(result.current.phone.value).toBe('300 123 4567');
  });

  it('no envía y marca los campos con datos inválidos', async () => {
    const { result } = await renderHook(() => useLoginForm());
    await fill(result, '300 12', '');
    await act(async () => {
      result.current.submit();
    });
    expect(signIn).not.toHaveBeenCalled();
    expect(result.current.phone.error).toBe('Ingresa un celular colombiano válido de 10 dígitos.');
    expect(result.current.password.error).toBe('Ingresa tu contraseña.');
  });

  it('envía el celular en E.164 y registra la sesión', async () => {
    signIn.mockResolvedValue({ ok: true, value: user });
    const { result } = await renderHook(() => useLoginForm());
    await fill(result, '300 123 4567', 'clave');
    await act(async () => {
      result.current.submit();
    });
    expect(signIn).toHaveBeenCalledWith('+573001234567', 'clave');
    expect(actions.completeSignIn).toHaveBeenCalledWith(user);
  });

  it('con credenciales inválidas muestra el error y marca ambos campos; escribir lo quita', async () => {
    signIn.mockResolvedValue({
      ok: false,
      failure: { kind: 'http', status: 401, code: 'INVALID_PHONE_NUMBER_OR_PASSWORD', retryAfterSeconds: null },
    });
    const { result } = await renderHook(() => useLoginForm());
    await fill(result, '300 123 4567', 'mala');
    await act(async () => {
      result.current.submit();
    });
    expect(result.current.formError).toBe('Teléfono o contraseña incorrectos.');
    expect(result.current.phone.invalid).toBe(true);
    expect(result.current.password.invalid).toBe(true);
    expect(result.current.submitting).toBe(false);
    await act(async () => {
      result.current.password.onChangeText('otra');
    });
    expect(result.current.formError).toBeNull();
    expect(result.current.phone.invalid).toBe(false);
  });

  it('un bloqueo muestra la espera pero no marca los campos como erróneos', async () => {
    signIn.mockResolvedValue({
      ok: false,
      failure: { kind: 'http', status: 429, code: 'SIGN_IN_LOCKED', retryAfterSeconds: 900 },
    });
    const { result } = await renderHook(() => useLoginForm());
    await fill(result, '300 123 4567', 'mala');
    await act(async () => {
      result.current.submit();
    });
    expect(result.current.formError).toContain('15 minutos');
    expect(result.current.phone.invalid).toBe(false);
  });
});
