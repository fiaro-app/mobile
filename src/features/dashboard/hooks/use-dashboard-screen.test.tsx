import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/dashboard/api/dashboard-api';
import { useDashboardScreen } from '@/features/dashboard/hooks/use-dashboard-screen';
import * as team from '@/features/team/api/team-api';

jest.mock('@/features/dashboard/api/dashboard-api', () => ({ fetchDashboard: jest.fn() }));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const dashboard = {
  totalPortfolio: 1000000, collectedToday: 100000, activeCollectors: 1, totalCollectors: 1, effectivenessToday: 0.95, clientsInArrears: 0, alerts: [],
  pendingSettlements: [{ id: 's1', date: '2026-10-09', status: 'PENDING' as const, collectorMembershipId: 'm1', expectedAmount: 100, collectedAmount: 90, collectedByMethod: { CASH: 90, NEQUI: 0, TRANSFER: 0 }, collectorNote: null }],
};

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(api).fetchDashboard.mockResolvedValue({ ok: true, value: dashboard });
  jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: [{ id: 'm1', userId: 'u', fullName: 'Ana Gómez', phone: '+573001234567', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: null }] });
});

describe('useDashboardScreen', () => {
  it('arma el resumen con los nombres de los colaboradores', async () => {
    const { result } = await renderHook(() => useDashboardScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.model?.pending[0]?.collectorName).toBe('Ana Gómez');
    });
    expect(result.current.loadFailed).toBe(false);
  });

  it('muestra el resumen aunque los colaboradores fallen', async () => {
    jest.mocked(team).fetchMembers.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useDashboardScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.model?.pending[0]?.collectorName).toBe('Cobrador sin nombre');
    });
  });

  it('marca el fallo, cierra la sesión vencida y reintenta', async () => {
    const expired = { kind: 'http', status: 401, code: null, retryAfterSeconds: null } as const;
    jest.mocked(api).fetchDashboard.mockResolvedValue({ ok: false, failure: expired });
    const { result } = await renderHook(() => useDashboardScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });
    expect(actions.signOutIfSessionExpired).toHaveBeenCalledWith(expired);
    jest.mocked(api).fetchDashboard.mockResolvedValue({ ok: true, value: dashboard });
    await act(async () => {
      result.current.refresh();
    });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(false);
    });
  });
});
