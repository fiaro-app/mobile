import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as accountApi from '@/features/account/api/account-api';
import { useAccountPassword } from '@/features/account/hooks/use-account-password';
import { useSessions } from '@/features/account/hooks/use-sessions';
import { toSessionRows } from '@/features/account/lib/session-schemas';
import * as authApi from '@/features/auth/api/auth-api';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/account/api/account-api', () => ({ fetchSessions: jest.fn(), revokeSession: jest.fn(), revokeOtherSessions: jest.fn() }));
jest.mock('@/features/auth/api/auth-api', () => ({ changePassword: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn(), completeSignOut: jest.fn() }));

const api = jest.mocked(accountApi);
const auth = jest.mocked(authApi);
const session = (id: string, over = {}) => ({ id, isCurrent: false, device: { label: `Equipo ${id}` }, ipAddress: '1.2.3.4', lastUsedAt: '2026-10-08T15:00:00Z', ...over });
const user = { id: 'u1', fullName: 'Ana Pérez', phone: '+573001234567', mustChangePassword: false };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  api.fetchSessions.mockResolvedValue({ ok: true, value: [session('a'), session('b', { isCurrent: true, ipAddress: null }), session('c', { lastUsedAt: '2026-10-09T15:00:00Z' })] });
});

describe('sesiones', () => {
  it('ordena: la actual primero y luego la más reciente', () => {
    const rows = toSessionRows([session('a'), session('b', { isCurrent: true, ipAddress: null }), session('c', { lastUsedAt: '2026-10-09T15:00:00Z' })]);
    expect(rows.map((row) => row.id)).toEqual(['b', 'c', 'a']);
    expect(rows[0]).toMatchObject({ detail: 'activa ahora', isCurrent: true });
    expect(rows[1]?.detail).toBe('IP 1.2.3.4 · último uso 9 oct 2026');
  });

  it('cierra una sesión puntual y todas las demás', async () => {
    api.revokeSession.mockResolvedValue({ ok: true, value: null });
    api.revokeOtherSessions.mockResolvedValue({ ok: true, value: {} });
    const { result } = await renderHook(() => useSessions(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });
    expect(result.current.hasOthers).toBe(true);
    await act(async () => {
      result.current.askOne(result.current.rows[1]!);
    });
    expect(result.current.dialog).toEqual({ kind: 'one', id: 'c', device: 'Equipo c' });
    await act(async () => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Sesión cerrada.');
    });
    expect(api.revokeSession).toHaveBeenCalledWith('c');
    expect(result.current.dialog.kind).toBe('none');
    await act(async () => {
      result.current.askOthers();
    });
    await act(async () => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Se cerraron las demás sesiones.');
    });
  });

  it('cancelar no hace nada; un fallo se explica; confirmar sin diálogo no pide', async () => {
    api.revokeOtherSessions.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useSessions(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(3);
    });
    await act(async () => {
      result.current.confirm();
    });
    expect(api.revokeOtherSessions).not.toHaveBeenCalled();
    await act(async () => {
      result.current.askOthers();
      result.current.cancel();
    });
    expect(result.current.dialog.kind).toBe('none');
    await act(async () => {
      result.current.askOthers();
    });
    await act(async () => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/Sin conexión/);
    });
    expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
  });

  it('marca el fallo de carga y refresca', async () => {
    api.fetchSessions.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useSessions(), { wrapper });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      result.current.refresh();
    });
  });
});

describe('useAccountPassword', () => {
  const fill = async (result: { current: ReturnType<typeof useAccountPassword> }, confirm = 'nueva-clave-123') => {
    await act(async () => {
      result.current.currentPassword.onChangeText('clave-actual');
      result.current.newPassword.onChangeText('nueva-clave-123');
      result.current.confirmPassword.onChangeText(confirm);
    });
  };

  beforeEach(() => {
    useSessionStore.getState().restore({ user, pinEnabled: false, pinOfferPending: false });
  });

  it('valida antes de enviar', async () => {
    const { result } = await renderHook(() => useAccountPassword(jest.fn()));
    await fill(result, 'otra');
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.confirmPassword.error).toMatch(/no coinciden/);
    });
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it('cambia la contraseña, actualiza la sesión y vuelve', async () => {
    auth.changePassword.mockResolvedValue({ ok: true, value: { ...user, fullName: 'Ana P.' } });
    const done = jest.fn();
    const { result } = await renderHook(() => useAccountPassword(done));
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(done).toHaveBeenCalled();
    });
    expect(auth.changePassword).toHaveBeenCalledWith('clave-actual', 'nueva-clave-123');
    expect(useSessionStore.getState().user?.fullName).toBe('Ana P.');
  });

  it('explica la contraseña actual incorrecta y cierra la sesión vencida', async () => {
    auth.changePassword.mockResolvedValueOnce({ ok: false, failure: { kind: 'http', status: 400, code: 'INVALID_PASSWORD', retryAfterSeconds: null } });
    const { result } = await renderHook(() => useAccountPassword(jest.fn()));
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).not.toBeNull();
    });
    auth.changePassword.mockResolvedValueOnce({ ok: false, failure: { kind: 'http', status: 401, code: null, retryAfterSeconds: null } });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(actions.completeSignOut).toHaveBeenCalled();
    });
  });
});
