import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/risk/api/risk-api';
import { useClientsRisk } from '@/features/risk/hooks/use-clients-risk';

jest.mock('@/features/risk/api/risk-api', () => ({ fetchClientsRisk: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const fetchRisk = jest.mocked(api).fetchClientsRisk;
const risk = (clientId: string) => ({ clientId, score: 90, level: 'VERY_HIGH' as const, loansCount: 1, factors: [] });

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useClientsRisk', () => {
  it('devuelve el riesgo por id', async () => {
    fetchRisk.mockResolvedValue({ ok: true, value: [risk('c1')] });
    const { result } = await renderHook(() => useClientsRisk(['c1']), { wrapper });

    await waitFor(() => { expect(result.current.get('c1')?.levelLabel).toBe('muy alto'); });
  });

  it('pide de a 50 clientes y no repite ids', async () => {
    fetchRisk.mockResolvedValue({ ok: true, value: [] });
    const ids = Array.from({ length: 120 }, (_, index) => `c${String(index % 110)}`);
    await renderHook(() => useClientsRisk(ids), { wrapper });

    await waitFor(() => { expect(fetchRisk).toHaveBeenCalledTimes(3); });
    expect(fetchRisk.mock.calls.map(([chunk]) => chunk.length)).toEqual([50, 50, 10]);
  });

  it('no pide nada sin ids y deja fuera a quienes fallan', async () => {
    const empty = await renderHook(() => useClientsRisk([]), { wrapper });
    expect(fetchRisk).not.toHaveBeenCalled();
    expect(empty.result.current.size).toBe(0);

    fetchRisk.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useClientsRisk(['c1']), { wrapper });
    await waitFor(() => { expect(fetchRisk).toHaveBeenCalled(); });
    expect(failed.result.current.size).toBe(0);
  });
});
