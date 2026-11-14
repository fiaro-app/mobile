import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/consolidated/api/consolidated-api';
import { useConsolidated } from '@/features/consolidated/hooks/use-consolidated';

jest.mock('@/features/consolidated/api/consolidated-api', () => ({ fetchConsolidated: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const fetchConsolidated = jest.mocked(api.fetchConsolidated);
const RANGE = { from: '2026-10-01', to: '2026-10-03' };
const FIGURES = { totalPortfolio: 1, portfolioAtRisk: 0, arrearsRate: 0, expectedAmount: 0, collectedAmount: 0, effectiveness: null };
const DATA = { from: RANGE.from, to: RANGE.to, lenders: [{ lenderId: 'a', name: 'A', ...FIGURES }, { lenderId: 'b', name: 'B', ...FIGURES }], totals: FIGURES };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useConsolidated', () => {
  it('carga el consolidado y lo deja listo para dibujar', async () => {
    fetchConsolidated.mockResolvedValue({ ok: true, value: DATA });
    const { result } = await renderHook(() => useConsolidated(RANGE, true), { wrapper });

    await waitFor(() => {
      expect(result.current.model).not.toBeNull();
    });
    expect(fetchConsolidated).toHaveBeenCalledWith(RANGE);

    await act(async () => {
      result.current.refresh();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(fetchConsolidated).toHaveBeenCalledTimes(2);
    });
  });

  it('si el plan no lo trae no pide nada ni al refrescar', async () => {
    const { result } = await renderHook(() => useConsolidated(RANGE, false), { wrapper });

    await act(async () => {
      result.current.refresh();
      await Promise.resolve();
    });

    expect(fetchConsolidated).not.toHaveBeenCalled();
    expect(result.current.model).toBeNull();
  });

  it('si falla, el modelo queda en null y no bloquea la pantalla', async () => {
    fetchConsolidated.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useConsolidated(RANGE, true), { wrapper });

    await waitFor(() => {
      expect(fetchConsolidated).toHaveBeenCalled();
    });
    expect(result.current.model).toBeNull();
  });
});
