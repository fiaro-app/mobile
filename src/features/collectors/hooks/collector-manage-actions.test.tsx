import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/collectors/api/collectors-api';
import { useCollectorManage } from '@/features/collectors/hooks/use-collector-manage';
import * as team from '@/features/team/api/team-api';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

jest.mock('@/features/collectors/api/collectors-api', () => ({
  inviteCollector: jest.fn(),
  deactivateCollector: jest.fn(),
  resetCollectorPassword: jest.fn(),
  changeCollectorPortfolio: jest.fn(),
  fetchPortfolios: jest.fn(),
  fetchCollectorStats: jest.fn(),
  fetchCollectorActiveLoanIds: jest.fn(),
  reactivateCollector: jest.fn(),
  deleteCollector: jest.fn(),
}));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/share-text', () => ({ shareText: jest.fn() }));

const a = jest.mocked(api);
const t = jest.mocked(team);
const members = [
  { id: 'm1', userId: 'u1', fullName: 'Ana Gómez', phone: '+573001234567', roles: ['COLLECTOR' as const], status: 'ACTIVE' as const, portfolioId: 'p1' },
  { id: 'm2', userId: 'u2', fullName: 'Luis Díaz', phone: '+573115550102', roles: ['COLLECTOR' as const], status: 'INACTIVE' as const, portfolioId: null },
];
const portfolios = [{ id: 'p1', name: 'General', isDefault: true }, { id: 'p2', name: 'Norte', isDefault: false }];
const stats = { from: '2026-10-01', to: '2026-10-09', expectedAmount: 100, collectedAmount: 90, effectiveness: 0.9, visitsCount: 2, overdueAmount: 0 };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  t.fetchMembers.mockResolvedValue({ ok: true, value: members });
  a.fetchPortfolios.mockResolvedValue({ ok: true, value: portfolios });
  a.fetchCollectorStats.mockResolvedValue({ ok: true, value: stats });
  a.fetchCollectorActiveLoanIds.mockResolvedValue({ ok: true, value: [] });
});

describe('useCollectorManage: baja, reactivación y borrado', () => {
  const ready = async (id = 'm1') => {
    const hook = await renderHook(() => useCollectorManage(id), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.person).not.toBeNull();
    });
    return hook;
  };

  it('con préstamos activos pide a quién pasarlos y los reasigna todos', async () => {
    const withPeer = [...members, { ...members[0]!, id: 'm3', userId: 'u3', fullName: 'Rosa Paz' }];
    t.fetchMembers.mockResolvedValue({ ok: true, value: withPeer });
    a.fetchCollectorActiveLoanIds.mockResolvedValue({ ok: true, value: ['l1', 'l2'] });
    a.deactivateCollector.mockResolvedValueOnce({ ok: true, value: {} });
    const { result } = await ready();
    await waitFor(() => {
      expect(result.current.activeLoanCount).toBe(2);
    });
    expect(result.current.destinationOptions).toEqual([{ value: 'm3', label: 'Rosa Paz' }]);
    await act(async () => {
      result.current.confirmDeactivate();
    });
    expect(result.current.dialog).toBe('destination');
    await act(async () => {
      result.current.chooseDestination('m3');
    });
    expect(a.deactivateCollector).toHaveBeenCalledWith('m1', [
      { loanId: 'l1', collectorMembershipId: 'm3' },
      { loanId: 'l2', collectorMembershipId: 'm3' },
    ]);
  });

  it('no da de baja sin a quién pasar los préstamos ni sin poder revisarlos', async () => {
    a.fetchCollectorActiveLoanIds.mockResolvedValueOnce({ ok: true, value: ['l1'] });
    const { result } = await ready();
    await waitFor(() => {
      expect(result.current.activeLoanCount).toBe(1);
    });
    await act(async () => {
      result.current.confirmDeactivate();
    });
    expect(result.current.error).toMatch(/No hay otro cobrador activo/);
    a.fetchCollectorActiveLoanIds.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await ready();
    await waitFor(() => {
      expect(a.fetchCollectorActiveLoanIds).toHaveBeenCalled();
    });
    await act(async () => {
      failed.result.current.confirmDeactivate();
    });
    expect(a.deactivateCollector).not.toHaveBeenCalled();
  });

  it('reactiva a un inactivo y borra un registro por error', async () => {
    a.reactivateCollector.mockResolvedValueOnce({ ok: true, value: {} });
    a.deleteCollector.mockResolvedValueOnce({ ok: true, value: null });
    const { result } = await ready('m2');
    await act(async () => {
      result.current.confirmReactivate();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cobrador reactivado.');
    });
    await act(async () => {
      result.current.confirmRemove();
    });
    await waitFor(() => {
      expect(result.current.removed).toBe(true);
    });
    expect(result.current.person).toMatchObject({ isOwner: false, isSelf: false });
  });

  it('reconoce a la propia persona para no ofrecerle administrarse', async () => {
    useWorkspaceStore.getState().loaded(['OWNER', 'COLLECTOR'], 'm2');
    const { result } = await ready('m2');
    expect(result.current.person?.isSelf).toBe(true);
    useWorkspaceStore.getState().reset();
  });

});
