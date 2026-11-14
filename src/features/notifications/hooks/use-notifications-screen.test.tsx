import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/notifications/api/notifications-api';
import { useUnreadCount } from '@/features/notifications/hooks/use-notifications';
import { useNotificationsScreen } from '@/features/notifications/hooks/use-notifications-screen';

jest.mock('@/features/notifications/api/notifications-api', () => ({ fetchNotifications: jest.fn(), fetchUnreadCount: jest.fn(), markRead: jest.fn(), markAllRead: jest.fn(), deleteNotification: jest.fn(), clearNotifications: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const a = jest.mocked(api);
const item = (id: string, readAt: string | null, entity: 'DAILY_SETTLEMENT' | null = null) => ({
  id, severity: 'INFO' as const, title: `Aviso ${id}`, body: 'b', relatedEntityType: entity, relatedEntityId: null, readAt, createdAt: '2026-10-09T10:00:00Z',
});

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

async function ready() {
  const hook = await renderHook(() => useNotificationsScreen(), { wrapper });
  await waitFor(() => {
    expect(hook.result.current.loading).toBe(false);
  });
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  a.fetchNotifications.mockResolvedValue({ ok: true, value: [item('n1', null, 'DAILY_SETTLEMENT'), item('n2', '2026-10-09T11:00:00Z')] });
  a.markRead.mockResolvedValue({ ok: true, value: item('n1', 'x') });
  a.markAllRead.mockResolvedValue({ ok: true, value: {} });
  a.fetchUnreadCount.mockResolvedValue({ ok: true, value: 1 });
  a.deleteNotification.mockResolvedValue({ ok: true, value: {} });
  a.clearNotifications.mockResolvedValue({ ok: true, value: 1 });
});

describe('useNotificationsScreen', () => {
  it('arma las filas y sabe si hay sin leer', async () => {
    const { result } = await ready();
    expect(result.current.rows.map((row) => row.unread)).toEqual([true, false]);
    expect(result.current.hasUnread).toBe(true);
  });

  it('abrir una sin leer la marca y devuelve su destino; una leída no pide nada', async () => {
    const { result } = await ready();
    let target: unknown;
    await act(async () => {
      target = result.current.open(result.current.rows[0]!);
    });
    expect(target).toBe('/settlement');
    await waitFor(() => {
      expect(a.markRead).toHaveBeenCalledWith('n1');
    });
    await act(async () => {
      result.current.open(result.current.rows[1]!);
    });
    expect(a.markRead).toHaveBeenCalledTimes(1);
  });

  it('marca todas como leídas', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.markAll();
    });
    await waitFor(() => {
      expect(a.markAllRead).toHaveBeenCalled();
    });
  });

  it('sabe si hay leídas, borra una y borra las leídas o todas', async () => {
    const { result } = await ready();
    expect(result.current.hasRead).toBe(true);
    await act(async () => {
      result.current.remove(result.current.rows[1]!);
    });
    await waitFor(() => {
      expect(a.deleteNotification).toHaveBeenCalledWith('n2');
    });
    await act(async () => {
      result.current.clear(true);
    });
    await waitFor(() => {
      expect(a.clearNotifications).toHaveBeenCalledWith(true);
    });
    await act(async () => {
      result.current.clear(false);
    });
    await waitFor(() => {
      expect(a.clearNotifications).toHaveBeenCalledWith(false);
    });
  });

  it('marca el fallo de carga, reintenta y cierra la sesión si venció', async () => {
    const expired = { kind: 'http', status: 401, code: null, retryAfterSeconds: null } as const;
    a.fetchNotifications.mockResolvedValue({ ok: false, failure: expired });
    const { result } = await ready();
    expect(result.current.loadFailed).toBe(true);
    expect(actions.signOutIfSessionExpired).toHaveBeenCalledWith(expired);
    a.fetchNotifications.mockResolvedValue({ ok: true, value: [] });
    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(false);
    });
  });
});

describe('useUnreadCount', () => {
  it('devuelve el conteo del API', async () => {
    const { result } = await renderHook(() => useUnreadCount(), { wrapper });
    await waitFor(() => {
      expect(result.current.data).toBe(1);
    });
  });
});
