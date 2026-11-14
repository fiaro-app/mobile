import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { fetchLenderStats } from '@/features/lender-stats/api/lender-stats-api';
import { useLenderStatsScreen } from '@/features/lender-stats/hooks/use-lender-stats-screen';
import { LenderStatsSchema } from '@/features/lender-stats/lib/lender-stats-schemas';
import { buildLenderStatsModel } from '@/features/lender-stats/lib/lender-stats-view';
import { pointsTrend, relativeTrend } from '@/features/lender-stats/lib/trend';
import * as team from '@/features/team/api/team-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/collectors/api/collectors-api', () => ({ fetchPortfolios: () => Promise.resolve({ ok: true, value: [{ id: 'p1', name: 'Zona Norte' }] }) }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const request = jest.mocked(authedRequest);
const stats = (over = {}) => ({
  from: '2026-10-01', to: '2026-10-09', totalPortfolio: 18400000, portfolioAtRisk: 2000000, arrearsRate: 0.15,
  arrearsByAge: [{ label: '0-7' as const, amount: 100000, clientsCount: 1 }, { label: '8-15' as const, amount: 0, clientsCount: 0 }, { label: '16-30' as const, amount: 400000, clientsCount: 2 }, { label: '30+' as const, amount: 0, clientsCount: 0 }],
  topArrears: [{ clientId: 'c1', clientFullName: 'Marta Gómez', overdueDays: 17, overdueAmount: 336000 }],
  collectorPerformance: [{ collectorMembershipId: 'm1', fullName: 'Ana Gómez', effectiveness: 0.95, overdueAmount: 0 }],
  expectedAmount: 1000000, collectedAmount: 900000, effectiveness: 0.9,
  previous: { totalPortfolio: 17000000, portfolioAtRisk: 1500000, arrearsRate: 0.1, collectedAmount: 800000, effectiveness: 0.8 }, ...over,
});

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('tendencias', () => {
  it('relativa: sube/baja/igual y el color según la polaridad', () => {
    expect(relativeTrend(120, 100, 'higher-is-better')).toEqual({ direction: 'up', label: '↑ 20 %', tone: 'good' });
    expect(relativeTrend(120, 100, 'lower-is-better')?.tone).toBe('bad');
    expect(relativeTrend(80, 100, 'lower-is-better')).toEqual({ direction: 'down', label: '↓ 20 %', tone: 'good' });
    expect(relativeTrend(120, 100, 'neutral')?.tone).toBe('neutral');
    expect(relativeTrend(100.2, 100, 'higher-is-better')).toEqual({ direction: 'flat', label: '= igual', tone: 'neutral' });
    expect(relativeTrend(1, 0, 'neutral')).toBeNull();
    expect(relativeTrend(1, null, 'neutral')).toBeNull();
  });

  it('en puntos', () => {
    expect(pointsTrend(0.9, 0.8, 'higher-is-better')).toEqual({ direction: 'up', label: '↑ 10 pts', tone: 'good' });
    expect(pointsTrend(null, 0.8, 'higher-is-better')).toBeNull();
    expect(pointsTrend(0.9, undefined, 'higher-is-better')).toBeNull();
  });
});

describe('modelo de estadísticas', () => {
  it('arma indicadores, mora por antigüedad, morosos y cobradores', () => {
    const model = buildLenderStatsModel(stats());
    expect(model.period).toBe('1 oct 2026 – 9 oct 2026');
    expect(model.kpis.map((kpi) => [kpi.key, kpi.value, kpi.tone])).toEqual([
      ['portfolio', '$18.4M', 'neutral'], ['atRisk', '$2M', 'bad'], ['arrearsRate', '15 %', 'warning'], ['collected', '$900.000', 'good'], ['effectiveness', '90 %', 'good'],
    ]);
    expect(model.kpis[1]?.trend).toMatchObject({ direction: 'up', tone: 'bad' });
    expect(model.buckets).toEqual([
      { label: '0–7 días', amount: '$100.000', clients: '1 cliente', percent: 25 }, { label: '8–15 días', amount: '$0', clients: '0 clientes', percent: 0 },
      { label: '16–30 días', amount: '$400.000', clients: '2 clientes', percent: 100 }, { label: 'Más de 30 días', amount: '$0', clients: '0 clientes', percent: 0 },
    ]);
    expect(model.topArrears[0]).toEqual({ id: 'c1', name: 'Marta Gómez', days: '17 días en mora', amount: '$336.000' });
    expect(model.collectors[0]).toMatchObject({ name: 'Ana Gómez', effectiveness: '95 %', tone: 'good' });
    expect(model.isEmpty).toBe(false);
  });

  it('umbrales de mora y vacío', () => {
    expect(buildLenderStatsModel(stats({ arrearsRate: 0.25 })).kpis[2]?.tone).toBe('bad');
    expect(buildLenderStatsModel(stats({ arrearsRate: 0.05 })).kpis[2]?.tone).toBe('good');
    expect(buildLenderStatsModel(stats({ arrearsRate: null })).kpis[2]).toMatchObject({ value: '—', tone: 'neutral' });
    const empty = buildLenderStatsModel(stats({ totalPortfolio: 0, collectorPerformance: [], arrearsByAge: [{ label: '0-7', amount: 0, clientsCount: 0 }], previous: null }));
    expect(empty).toMatchObject({ isEmpty: true });
    expect(empty.buckets[0]?.percent).toBe(0);
    expect(empty.kpis[0]?.trend).toBeNull();
    expect(LenderStatsSchema.parse(stats()).totalPortfolio).toBe(18400000);
    expect(() => LenderStatsSchema.parse({})).toThrow();
  });
});

describe('api y pantalla', () => {
  it('pide con includePrevious y, opcionalmente, un cobrador', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchLenderStats({ from: 'a', to: 'b' });
    await fetchLenderStats({ from: 'a', to: 'b' }, 'm1');
    expect(request.mock.calls[0]).toMatchObject(['/lenders/me/stats', expect.any(Function), { method: 'QUERY', body: { dateRange: { from: 'a', to: 'b' }, includePrevious: true } }]);
    expect(request.mock.calls[1]?.[2]).toMatchObject({ body: { collectorMembershipId: 'm1' } });
  });

  it('la pantalla cambia de período y de cobrador', async () => {
    jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: [{ id: 'm1', userId: 'u', fullName: 'Ana Gómez', phone: '+573001234567', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: null }] });
    request.mockImplementation((_path, parse) => Promise.resolve({ ok: true, value: (parse as (b: unknown) => unknown)(stats()) }) as never);
    const { result } = await renderHook(() => useLenderStatsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.model).not.toBeNull();
    });
    expect(result.current).toMatchObject({ period: 'month', collectorLabel: 'Todos los cobradores' });
    await act(async () => {
      result.current.setPeriod('year');
      result.current.openSheet();
    });
    expect(result.current.sheetOpen).toBe(true);
    await waitFor(() => {
      expect(result.current.collectorOptions).toHaveLength(2);
    });
    await act(async () => {
      result.current.setCollector('m1');
    });
    expect(result.current).toMatchObject({ collectorLabel: 'Ana Gómez', sheetOpen: false, period: 'year' });
    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith('/lenders/me/stats', expect.any(Function), expect.objectContaining({ body: expect.objectContaining({ collectorMembershipId: 'm1' }) as unknown }));
    });
    await act(async () => {
      result.current.openSheet();
      result.current.closeSheet();
      result.current.refresh();
    });
    await act(async () => {
      result.current.dates.open('from');
    });
    await act(async () => {
      result.current.dates.pick('2026-01-01');
    });
    expect(result.current.period).toBeNull();
    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith('/lenders/me/stats', expect.any(Function), expect.objectContaining({ body: expect.objectContaining({ dateRange: { from: '2026-01-01', to: '2026-01-01' } }) as unknown }));
    });
    await waitFor(() => {
      expect(result.current.portfolio.options).toHaveLength(2);
    });
    await act(async () => {
      result.current.portfolio.openSheet();
    });
    expect(result.current.portfolio.open).toBe(true);
    await act(async () => {
      result.current.portfolio.select('p1');
    });
    expect(result.current.portfolio).toMatchObject({ label: 'Zona Norte', open: false });
    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith('/lenders/me/stats', expect.any(Function), expect.objectContaining({ body: expect.objectContaining({ portfolioId: 'p1' }) as unknown }));
    });
    await act(async () => {
      result.current.portfolio.openSheet();
      result.current.portfolio.closeSheet();
      result.current.setPeriod('week');
    });
    expect(result.current.period).toBe('week');
    expect(result.current.dates.applied).toBeNull();
  });

  it('marca el fallo', async () => {
    jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: [] });
    request.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useLenderStatsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });
  });
});
