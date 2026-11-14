import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/routes/api/routes-api';
import { useRoutesScreen } from '@/features/routes/hooks/use-routes-screen';
import * as team from '@/features/team/api/team-api';

jest.mock('@/features/routes/api/routes-api', () => ({ fetchRoutes: jest.fn() }));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const a = jest.mocked(api);
const route = (date: string) => ({ date, collector: { membershipId: 'm1', fullName: 'Ana Soto' }, startedAt: `${date}T13:05:00Z`, endedAt: `${date}T21:30:00Z`, visitsCount: 12, paidCount: 9, expectedAmount: 360_000, collectedAmount: 270_000 });

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: [] });
  a.fetchRoutes.mockResolvedValue({ ok: true, value: { items: [route('2026-10-14')], total: 2 } });
});

describe('useRoutesScreen', () => {
  it('lista las rutas de hoy y pide más páginas', async () => {
    const { result } = await renderHook(() => useRoutesScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows[0]?.title).toBe('Ana Soto');
    });
    expect(a.fetchRoutes).toHaveBeenCalledWith(1, { range: null, collectorId: null });
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(a.fetchRoutes).toHaveBeenCalledWith(2, { range: null, collectorId: null });
    });
  });

  it('marca el fallo y refresca', async () => {
    a.fetchRoutes.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useRoutesScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.failed).toBe(true);
    });
    await act(async () => {
      result.current.refresh();
    });
  });
});
