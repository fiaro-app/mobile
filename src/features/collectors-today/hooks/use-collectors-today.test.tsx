import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/collectors-today/api/collectors-today-api';
import { useCollectorsToday } from '@/features/collectors-today/hooks/use-collectors-today';
import * as actions from '@/features/auth/store/session-actions';

jest.mock('@/features/collectors-today/api/collectors-today-api', () => ({ fetchCollectorsToday: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const fetchToday = jest.mocked(api.fetchCollectorsToday);
const TODAY = {
  date: '2026-10-15',
  counts: { NO_ROUTE: 0, NOT_STARTED: 1, IN_PROGRESS: 0, FINISHED: 0 },
  collectors: [
    { membershipId: 'm1', fullName: 'Ana', status: 'NOT_STARTED' as const, routeLoans: 4, visitedLoans: 0, pendingLoans: 4, expectedAmount: 80000, collectedAmount: 0, firstVisitAt: null, lastVisitAt: null, settlementStatus: null },
  ],
};

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCollectorsToday', () => {
  it('carga las rutas de hoy y las deja listas para dibujar', async () => {
    fetchToday.mockResolvedValue({ ok: true, value: TODAY });
    const { result } = await renderHook(() => useCollectorsToday(), { wrapper });
    await waitFor(() => {
      expect(result.current.model).not.toBeNull();
    });
    expect(result.current.model?.rows[0]).toMatchObject({ name: 'Ana', badge: 'Sin iniciar' });
  });

  it('si no carga, el modelo queda en null y no bloquea el Resumen', async () => {
    fetchToday.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useCollectorsToday(), { wrapper });
    await waitFor(() => {
      expect(fetchToday).toHaveBeenCalled();
    });
    expect(result.current.model).toBeNull();
    expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
  });

  it('refresh vuelve a pedirlas', async () => {
    fetchToday.mockResolvedValue({ ok: true, value: TODAY });
    const { result } = await renderHook(() => useCollectorsToday(), { wrapper });
    await waitFor(() => {
      expect(result.current.model).not.toBeNull();
    });
    await act(async () => {
      result.current.refresh();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(fetchToday).toHaveBeenCalledTimes(2);
    });
  });
});
