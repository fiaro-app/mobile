import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/settlement-review/api/review-api';
import { useReviewDetail } from '@/features/settlement-review/hooks/use-review-detail';
import { useReviewScreen } from '@/features/settlement-review/hooks/use-review-screen';
import * as team from '@/features/team/api/team-api';

jest.mock('@/features/settlement-review/api/review-api', () => ({ fetchSettlements: jest.fn(), fetchSettlementById: jest.fn(), approveSettlement: jest.fn(), rejectSettlement: jest.fn() }));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const a = jest.mocked(api);
const settlement = (id: string, over = {}) => ({ id, collectorMembershipId: 'm1', date: '2026-10-09', expectedAmount: 100, collectedAmount: 90, collectedByMethod: { CASH: 90, NEQUI: 0, TRANSFER: 0 }, status: 'PENDING' as const, collectorNote: null, reviewNote: null, reviewedAt: null, submittedAt: '2026-10-09T10:00:00Z', ...over });
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: [{ id: 'm1', userId: 'u', fullName: 'Ana Gómez', phone: '+573001234567', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: null }] });
  a.fetchSettlements.mockResolvedValue({ ok: true, value: { items: [settlement('s1')], total: 2 } });
  a.fetchSettlementById.mockResolvedValue({ ok: true, value: settlement('s1') });
});

describe('useReviewScreen', () => {
  it('lista pendientes con nombre, cambia de estado y pide más páginas', async () => {
    const { result } = await renderHook(() => useReviewScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows[0]?.title).toBe('Ana Gómez');
    });
    expect(a.fetchSettlements).toHaveBeenCalledWith(1, { status: 'PENDING', range: null, collectorId: null });
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(a.fetchSettlements).toHaveBeenCalledWith(2, { status: 'PENDING', range: null, collectorId: null });
    });
    await act(async () => {
      result.current.setStatus('APPROVED');
    });
    await waitFor(() => {
      expect(a.fetchSettlements).toHaveBeenCalledWith(1, { status: 'APPROVED', range: null, collectorId: null });
    });
    await act(async () => {
      result.current.setStatus('ALL');
    });
    await waitFor(() => {
      expect(a.fetchSettlements).toHaveBeenCalledWith(1, { status: null, range: null, collectorId: null });
    });
  });

  it('marca el fallo y refresca', async () => {
    a.fetchSettlements.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useReviewScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.failed).toBe(true);
    });
    await act(async () => {
      result.current.refresh();
    });
  });
});

describe('useReviewDetail', () => {
  const ready = async () => {
    const hook = await renderHook(() => useReviewDetail('s1'), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.model).not.toBeNull();
    });
    return hook;
  };

  it('arma el detalle', async () => {
    const { result } = await ready();
    expect(result.current.model).toMatchObject({ collectorName: 'Ana Gómez', reviewable: true });
  });

  it('aprueba y actualiza el estado', async () => {
    a.approveSettlement.mockResolvedValue({ ok: true, value: settlement('s1', { status: 'APPROVED' }) });
    const { result } = await ready();
    await act(async () => {
      result.current.startDecision('approve');
    });
    expect(result.current.decision).toBe('approve');
    await act(async () => {
      result.current.confirmDecision();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cuadre aprobado.');
    });
    expect(a.approveSettlement).toHaveBeenCalledWith('s1', '');
    expect(result.current.model?.reviewable).toBe(false);
  });

  it('rechaza con comentario', async () => {
    a.rejectSettlement.mockResolvedValue({ ok: true, value: settlement('s1', { status: 'REJECTED', reviewNote: 'Falta' }) });
    const { result } = await ready();
    await act(async () => {
      result.current.startDecision('reject');
      result.current.setNote('Falta');
    });
    await act(async () => {
      result.current.confirmDecision();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cuadre rechazado.');
    });
    expect(a.rejectSettlement).toHaveBeenCalledWith('s1', 'Falta');
  });

  it('explica el conflicto, cierra la sesión vencida y permite cancelar', async () => {
    a.approveSettlement.mockResolvedValueOnce(http(409, 'CONFLICT'));
    const { result } = await ready();
    await act(async () => {
      result.current.startDecision('approve');
    });
    await act(async () => {
      result.current.confirmDecision();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/ya fue revisado/);
    });
    a.approveSettlement.mockResolvedValueOnce(http(401));
    await act(async () => {
      result.current.startDecision('approve');
    });
    await act(async () => {
      result.current.confirmDecision();
    });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    });
    await act(async () => {
      result.current.startDecision('reject');
      result.current.cancelDecision();
    });
    expect(result.current.decision).toBeNull();
    await act(async () => {
      result.current.confirmDecision();
    });
  });

  it('distingue no encontrado y error', async () => {
    a.fetchSettlementById.mockResolvedValue(http(404, 'NOT_FOUND'));
    const notFound = await renderHook(() => useReviewDetail('x'), { wrapper });
    await waitFor(() => {
      expect(notFound.result.current.notFound).toBe(true);
    });
    a.fetchSettlementById.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useReviewDetail('y'), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});
