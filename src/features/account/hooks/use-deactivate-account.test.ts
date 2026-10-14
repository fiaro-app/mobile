import { act, renderHook, waitFor } from '@testing-library/react-native';
import { deactivateAccount } from '@/features/account/api/account-api';
import { useDeactivateAccount } from '@/features/account/hooks/use-deactivate-account';
import { completeSignOut } from '@/features/auth/store/session-actions';

jest.mock('@/features/account/api/account-api', () => ({ deactivateAccount: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ completeSignOut: jest.fn() }));

const api = jest.mocked(deactivateAccount);
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;

async function confirmWith(password: string) {
  const { result } = await renderHook(() => useDeactivateAccount());
  await act(() => {
    result.current.changePassword(password);
  });
  await act(() => {
    result.current.submit();
  });
  expect(result.current.confirming).toBe(true);
  await act(() => {
    result.current.confirm();
  });
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useDeactivateAccount', () => {
  it('sin contraseña no pide confirmar', async () => {
    const { result } = await renderHook(() => useDeactivateAccount());
    await act(() => {
      result.current.submit();
    });
    expect(result.current).toMatchObject({ confirming: false, passwordError: 'Escribe tu contraseña.' });
  });

  it('al salir bien cierra la sesión', async () => {
    api.mockResolvedValue({ ok: true, value: {} });
    await confirmWith('la tienda abre a las seis');
    await waitFor(() => {
      expect(completeSignOut).toHaveBeenCalled();
    });
    expect(api).toHaveBeenCalledWith('la tienda abre a las seis');
  });

  it('marca la contraseña equivocada en el campo', async () => {
    api.mockResolvedValue(http(400, 'INVALID_PASSWORD'));
    const result = await confirmWith('otra');
    await waitFor(() => {
      expect(result.current.passwordError).toBe('La contraseña no es correcta.');
    });
    expect(result.current.submitting).toBe(false);
    expect(completeSignOut).not.toHaveBeenCalled();
  });

  it('explica la falta de red y otros fallos, y deja cancelar', async () => {
    api.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const offline = await confirmWith('x');
    await waitFor(() => {
      expect(offline.current.formError).toContain('Sin conexión');
    });
    api.mockResolvedValue(http(500));
    const failed = await confirmWith('x');
    await waitFor(() => {
      expect(failed.current.formError).toBe('No pudimos desactivar tu cuenta. Intenta de nuevo.');
    });
    await act(() => {
      failed.current.submit();
    });
    await act(() => {
      failed.current.cancel();
    });
    expect(failed.current.confirming).toBe(false);
  });

  it('con la sesión ya vencida también sale al login', async () => {
    api.mockResolvedValue(http(401));
    await confirmWith('x');
    await waitFor(() => {
      expect(completeSignOut).toHaveBeenCalled();
    });
  });
});
