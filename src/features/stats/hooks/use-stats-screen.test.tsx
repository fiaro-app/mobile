import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/stats/api/stats-api';
import { useStatsScreen } from '@/features/stats/hooks/use-stats-screen';

jest.mock('@/features/stats/api/stats-api', () => ({ fetchPeriodStats: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const fetchStats = jest.mocked(api.fetchPeriodStats);
const stats = (collectedAmount: number) => ({ from: 'a', to: 'b', expectedAmount: 1000, collectedAmount, effectiveness: 0.5, visitsCount: 3, overdueAmount: 70 });

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useStatsScreen', () => {
  it('arma las cifras del mes', async () => {
    fetchStats.mockResolvedValue({ ok: true, value: stats(500) });
    const { result } = await renderHook(() => useStatsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.model).not.toBeNull();
    });
    expect(result.current.period).toBe('month');
    expect(result.current.model).toMatchObject({ expected: '$1.000', effectiveness: '50 %', visits: '3', overdue: '$70', comparison: { direction: 'same' } });
  });

  it('cambia de período y pide otro rango', async () => {
    fetchStats.mockResolvedValue({ ok: true, value: stats(100) });
    const { result } = await renderHook(() => useStatsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    await act(async () => {
      result.current.setPeriod('year');
    });
    await waitFor(() => {
      expect(fetchStats).toHaveBeenCalledWith(expect.objectContaining({ from: expect.stringMatching(/-01-01$/) as string }));
    });
    expect(result.current.period).toBe('year');
  });

  it('marca el fallo y cierra la sesión si venció', async () => {
    const expired = { kind: 'http', status: 401, code: null, retryAfterSeconds: null } as const;
    fetchStats.mockResolvedValue({ ok: false, failure: expired });
    const { result } = await renderHook(() => useStatsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });
    expect(actions.signOutIfSessionExpired).toHaveBeenCalledWith(expired);
    fetchStats.mockResolvedValue({ ok: true, value: stats(1) });
    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(false);
    });
  });
});
