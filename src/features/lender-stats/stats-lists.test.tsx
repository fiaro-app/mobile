import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { fetchCollectorPerformance, fetchTopArrears } from '@/features/lender-stats/api/lender-stats-api';
import { useStatsList } from '@/features/lender-stats/hooks/use-stats-list';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listas largas de las estadísticas: API', () => {
  it('pide el ranking de mora y el desempeño paginados, de 10 en 10', async () => {
    request.mockResolvedValue({ ok: true, value: { items: [], total: 0 } });
    await fetchTopArrears(2, 'm1');
    await fetchCollectorPerformance(1, { from: '2026-10-01', to: '2026-10-09' });
    expect(request.mock.calls[0]?.slice(0, 1)).toEqual(['/lenders/me/stats/top-arrears']);
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { page: 2, pageSize: 10, collectorMembershipId: 'm1' } });
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 10, dateRange: { from: '2026-10-01', to: '2026-10-09' } } });
    const arrears = { clientId: 'c1', clientFullName: 'Ana', overdueDays: 2, overdueAmount: 10 };
    expect(parserOf(0)({ data: [arrears], meta: { total: 1 } })).toEqual({ items: [arrears], total: 1 });
    const performance = { collectorMembershipId: 'm1', fullName: 'Luis', effectiveness: null, overdueAmount: 0 };
    expect(parserOf(1)({ data: [performance], meta: { total: 1 } })).toEqual({ items: [performance], total: 1 });
    expect(() => parserOf(1)({})).toThrow();
  });

  it('el ranking sin cobrador no lo envía', async () => {
    request.mockResolvedValue({ ok: true, value: { items: [], total: 0 } });
    await fetchTopArrears(1);
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 10 } });
  });
});

describe('useStatsList', () => {
  const five = ['a', 'b', 'c', 'd', 'e'];

  it('con menos de 5 filas no ofrece ver más', async () => {
    const fetchPage = jest.fn();
    const { result } = await renderHook(() => useStatsList(['k1'], ['a'], fetchPage, String), { wrapper });
    expect(result.current).toEqual({ rows: ['a'], more: null });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('«Ver todos» trae la lista completa y «Ver más» la página siguiente', async () => {
    const fetchPage = jest.fn((page: number) => Promise.resolve({ ok: true as const, value: { items: page === 1 ? five.map((x) => `${x}1`) : ['z'], total: 6 } }));
    const { result } = await renderHook(() => useStatsList(['k2'], five, fetchPage, (item: string) => item.toUpperCase()), { wrapper });
    expect(result.current.more?.label).toBe('Ver todos');
    await act(async () => {
      result.current.more?.onPress();
    });
    await waitFor(() => {
      expect(result.current.rows).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);
    });
    expect(result.current.more?.label).toBe('Ver más');
    await act(async () => {
      result.current.more?.onPress();
    });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(6);
    });
    expect(result.current.more).toBeNull();
  });
});
