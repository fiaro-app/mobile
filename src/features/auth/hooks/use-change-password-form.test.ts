import { act, renderHook } from '@testing-library/react-native';
import * as api from '@/features/auth/api/auth-api';
import { useChangePasswordForm } from '@/features/auth/hooks/use-change-password-form';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/auth/api/auth-api', () => ({ changePassword: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ completeSignOut: jest.fn() }));

const change = jest.mocked(api.changePassword);
const temp = { id: '1', fullName: 'Luis Gómez', phone: '+573109998877', mustChangePassword: true };

async function fill(result: { current: ReturnType<typeof useChangePasswordForm> }, next: string, confirm = next) {
  await act(async () => {
    result.current.currentPassword.onChangeText('temporal');
    result.current.newPassword.onChangeText(next);
    result.current.confirmPassword.onChangeText(confirm);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.getState().signedIn({ user: temp, pinEnabled: false, pinOfferPending: false });
});

describe('useChangePasswordForm', () => {
  it('no envía una contraseña corta o que no coincide', async () => {
    const { result } = await renderHook(() => useChangePasswordForm());
    await fill(result, '1234', 'otra');
    await act(async () => {
      result.current.submit();
    });
    expect(change).not.toHaveBeenCalled();
    expect(result.current.newPassword.error).toBe('La contraseña debe tener mínimo 15 caracteres.');
    expect(result.current.confirmPassword.error).toBe('Las contraseñas no coinciden.');
  });

  it('actualiza la persona al cambiarla bien', async () => {
    change.mockResolvedValue({ ok: true, value: { ...temp, mustChangePassword: false } });
    const { result } = await renderHook(() => useChangePasswordForm());
    await fill(result, 'nueva-clave-segura-1');
    await act(async () => {
      result.current.submit();
    });
    expect(change).toHaveBeenCalledWith('temporal', 'nueva-clave-segura-1');
    expect(useSessionStore.getState().user?.mustChangePassword).toBe(false);
  });

  it('muestra el error del API cuando la contraseña es débil', async () => {
    change.mockResolvedValue({
      ok: false,
      failure: { kind: 'http', status: 400, code: 'PASSWORD_TOO_WEAK', retryAfterSeconds: null },
    });
    const { result } = await renderHook(() => useChangePasswordForm());
    await fill(result, 'tequieromucho12');
    await act(async () => {
      result.current.submit();
    });
    expect(result.current.formError).toContain('fácil de adivinar');
    expect(result.current.submitting).toBe(false);
  });

  it('cierra la sesión local si la sesión ya venció', async () => {
    change.mockResolvedValue({
      ok: false,
      failure: { kind: 'http', status: 401, code: 'UNAUTHORIZED', retryAfterSeconds: null },
    });
    const { result } = await renderHook(() => useChangePasswordForm());
    await fill(result, 'nueva-clave-segura-1');
    await act(async () => {
      result.current.submit();
    });
    expect(actions.completeSignOut).toHaveBeenCalled();
  });

  it('permite cerrar sesión desde el formulario', async () => {
    const { result } = await renderHook(() => useChangePasswordForm());
    await act(async () => {
      result.current.onSignOut();
    });
    expect(actions.completeSignOut).toHaveBeenCalled();
  });
});
