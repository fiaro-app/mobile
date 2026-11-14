import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/insights/api/insights-api';
import { useInsights } from '@/features/insights/hooks/use-insights';

jest.mock('@/features/insights/api/insights-api', () => ({ fetchInsights: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const fetchInsights = jest.mocked(api.fetchInsights);
const RANGE = { from: '2026-10-01', to: '2026-10-03' };
const DATA = {
  from: '2026-10-01', to: '2026-10-03', daily: [{ date: '2026-10-01', expected: 1000, collected: 500 }],
  income: { collected: 500, byMethod: { CASH: 500, NEQUI: 0, TRANSFER: 0 }, interest: 100, principalRecovered: 400, interestShare: 0.2 },
  origination: { loansCreated: 0, amountLent: 0, averageTicket: null, agreedInterest: 0 },
  visits: { PAID: 1, NOT_FOUND: 0, REFUSED: 0, RESCHEDULED: 0, total: 1, contactRate: 1, paidRate: 1 },
  settlements: { submitted: 0, balanced: 0, withDifference: 0, shortfall: 0, surplus: 0 },
  forecast: [], previous: { from: '2026-09-28', to: '2026-09-30', collected: 0, interest: 0, loansCreated: 0, amountLent: 0 },
};

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useInsights', () => {
  it('carga las estadísticas del rango y las deja listas para dibujar', async () => {
    fetchInsights.mockResolvedValue({ ok: true, value: DATA });
    const { result } = await renderHook(() => useInsights(RANGE), { wrapper });
    await waitFor(() => {
      expect(result.current.model).not.toBeNull();
    });
    expect(fetchInsights).toHaveBeenCalledWith(RANGE);
    expect(result.current.model?.cards.length).toBeGreaterThan(0);
  });

  it('si no cargan, el modelo queda en null y no bloquea la pantalla', async () => {
    fetchInsights.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useInsights(RANGE), { wrapper });
    await waitFor(() => {
      expect(fetchInsights).toHaveBeenCalled();
    });
    expect(result.current.model).toBeNull();
  });

  it('refresh vuelve a pedirlas', async () => {
    fetchInsights.mockResolvedValue({ ok: true, value: DATA });
    const { result } = await renderHook(() => useInsights(RANGE), { wrapper });
    await waitFor(() => {
      expect(result.current.model).not.toBeNull();
    });
    await act(async () => {
      result.current.refresh();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(fetchInsights).toHaveBeenCalledTimes(2);
    });
  });

  it('con enabled en false (el plan no trae estadísticas avanzadas) no pide nada', async () => {
    const { result } = await renderHook(() => useInsights(RANGE, false), { wrapper });

    expect(fetchInsights).not.toHaveBeenCalled();
    expect(result.current.model).toBeNull();
  });
});
