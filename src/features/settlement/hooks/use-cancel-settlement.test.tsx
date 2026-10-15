import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useSessionStore } from '@/features/auth/store/session-store';
import * as api from '@/features/settlement/api/settlement-api';
import { dayPhase } from '@/features/settlement/hooks/use-settlement-data';
import { useCancelSettlement } from '@/features/settlement/hooks/use-cancel-settlement';
import * as memory from '@/features/settlement/store/settlement-memory';

jest.mock('@/features/settlement/api/settlement-api', () => ({ cancelSettlement: jest.fn(), fetchDailySummary: jest.fn(), fetchSettlement: jest.fn() }));
jest.mock('@/features/settlement/store/settlement-memory', () => ({ recallSettlement: jest.fn(), forgetSettlement: jest.fn(), rememberSettlement: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const SETTLEMENT = {
  id: 's1', collectorMembershipId: 'm1', date: '2026-10-15', expectedAmount: 1, collectedAmount: 1,
  collectedByMethod: { CASH: 1, NEQUI: 0, TRANSFER: 0 }, status: 'PENDING' as const, collectorNote: null, reviewNote: null,
};
const SUMMARY = { date: '2026-10-15', expectedAmount: 1, collectedAmount: 1, collectedByMethod: { CASH: 1, NEQUI: 0, TRANSFER: 0 }, visits: [] };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.getState().signedIn({ user: { id: 'u1', fullName: 'Ana', phone: '+573001234567', mustChangePassword: false }, pinEnabled: false, pinOfferPending: false });
  jest.mocked(api.fetchDailySummary).mockResolvedValue({ ok: true, value: SUMMARY } as never);
  jest.mocked(memory.recallSettlement).mockResolvedValue('s1');
  jest.mocked(api.fetchSettlement).mockResolvedValue({ ok: true, value: SETTLEMENT } as never);
});

describe('dayPhase', () => {
  it('rechazado o sin cuadre deja el día abierto; en revisión o aprobado lo cierra', () => {
    expect(dayPhase(null)).toBe('open');
    expect(dayPhase({ ...SETTLEMENT, status: 'REJECTED' })).toBe('open');
    expect(dayPhase(SETTLEMENT)).toBe('in-review');
    expect(dayPhase({ ...SETTLEMENT, status: 'APPROVED' })).toBe('approved');
  });
});

describe('useCancelSettlement', () => {
  it('pide confirmación, cancela, olvida el cuadre y deja el día abierto', async () => {
    jest.mocked(api.cancelSettlement).mockResolvedValue({ ok: true, value: null });
    const { result } = await renderHook(() => useCancelSettlement(), { wrapper });
    await waitFor(() => { expect(result.current.canCancel).toBe(true); });

    await act(async () => { result.current.request(); });
    expect(result.current.dialogOpen).toBe(true);
    await act(async () => { result.current.confirm(); });

    await waitFor(() => { expect(result.current.canCancel).toBe(false); });
    expect(api.cancelSettlement).toHaveBeenCalledWith('s1');
    expect(memory.forgetSettlement).toHaveBeenCalledWith('u1', '2026-10-15');
    expect(result.current.dialogOpen).toBe(false);
  });

  it('si falla, avisa y conserva el cuadre', async () => {
    jest.mocked(api.cancelSettlement).mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useCancelSettlement(), { wrapper });
    await waitFor(() => { expect(result.current.canCancel).toBe(true); });

    await act(async () => { result.current.confirm(); });

    await waitFor(() => { expect(result.current.error).not.toBeNull(); });
    expect(result.current.canCancel).toBe(true);
    expect(memory.forgetSettlement).not.toHaveBeenCalled();
  });

  it('descartar el diálogo no cancela nada', async () => {
    const { result } = await renderHook(() => useCancelSettlement(), { wrapper });
    await waitFor(() => { expect(result.current.canCancel).toBe(true); });

    await act(async () => { result.current.request(); });
    await act(async () => { result.current.dismiss(); });

    expect(result.current.dialogOpen).toBe(false);
    expect(api.cancelSettlement).not.toHaveBeenCalled();
  });
});
