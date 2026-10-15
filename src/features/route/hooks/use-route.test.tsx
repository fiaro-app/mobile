import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/route/api/route-api';
import { useRoute } from '@/features/route/hooks/use-route';
import * as actions from '@/features/auth/store/session-actions';

jest.mock('@/features/route/api/route-api', () => ({ fetchRoute: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const fetchRoute = jest.mocked(api.fetchRoute);
const row = { loanId: 'l', clientId: 'c', clientFullName: 'Marta Gómez', balance: 1, overdueAmount: 0, overdueDays: 0, nextDueDate: null, collectedToday: 0 };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useRoute', () => {
  it('carga la ruta', async () => {
    fetchRoute.mockResolvedValue({ ok: true, value: [row] });
    const { result } = await renderHook(() => useRoute(), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
    expect(result.current.entries).toEqual([row]);
  });

  it('muestra "empty" cuando no hay clientes', async () => {
    fetchRoute.mockResolvedValue({ ok: true, value: [] });
    const { result } = await renderHook(() => useRoute(), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('empty');
    });
  });

  it('clasifica el fallo de red y se recupera al refrescar', async () => {
    fetchRoute.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useRoute(), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('offline');
    });
    fetchRoute.mockResolvedValueOnce({ ok: true, value: [row] });
    result.current.refresh();
    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
  });

  it('conserva la lista si un refresco falla', async () => {
    fetchRoute.mockResolvedValueOnce({ ok: true, value: [row] });
    const { result } = await renderHook(() => useRoute(), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
    fetchRoute.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    result.current.refresh();
    await waitFor(() => {
      expect(fetchRoute).toHaveBeenCalledTimes(2);
    });
    expect(result.current.state).toBe('ready');
    expect(result.current.entries).toEqual([row]);
  });

  it('un 401 cierra la sesión local', async () => {
    fetchRoute.mockResolvedValue({ ok: false, failure: { kind: 'http', status: 401, code: 'UNAUTHENTICATED', retryAfterSeconds: null } });
    await renderHook(() => useRoute(), { wrapper });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    });
  });

  it('un 403 es "forbidden"', async () => {
    fetchRoute.mockResolvedValue({ ok: false, failure: { kind: 'http', status: 403, code: 'FORBIDDEN', retryAfterSeconds: null } });
    const { result } = await renderHook(() => useRoute(), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('forbidden');
    });
  });
});
