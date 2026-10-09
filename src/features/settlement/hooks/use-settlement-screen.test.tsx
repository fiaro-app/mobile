import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import * as api from '@/features/settlement/api/settlement-api';
import { useSettlementScreen } from '@/features/settlement/hooks/use-settlement-screen';
import * as memory from '@/features/settlement/store/settlement-memory';

jest.mock('@/features/settlement/api/settlement-api', () => ({ fetchDailySummary: jest.fn(), postSettlement: jest.fn(), fetchSettlement: jest.fn() }));
jest.mock('@/features/settlement/store/settlement-memory', () => ({ recallSettlement: jest.fn(), rememberSettlement: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const a = jest.mocked(api);
const m = jest.mocked(memory);
const user = { id: 'u1', fullName: 'Ana Pérez', phone: '+573001234567', mustChangePassword: false };
const summary = { date: '2026-10-09', expectedAmount: 100000, collectedAmount: 90000, collectedByMethod: { CASH: 60000, NEQUI: 30000, TRANSFER: 0 } };
const settlement = (status: 'PENDING' | 'APPROVED' | 'REJECTED', reviewNote: string | null = null) => ({
  id: 's1', date: '2026-10-09', expectedAmount: 100000, collectedAmount: 90000, collectedByMethod: summary.collectedByMethod, status, collectorNote: 'x', reviewNote,
});

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

async function ready() {
  const hook = await renderHook(() => useSettlementScreen(), { wrapper });
  await waitFor(() => {
    expect(hook.result.current.loading).toBe(false);
  });
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.getState().restore({ user, pinEnabled: false, pinOfferPending: false });
  a.fetchDailySummary.mockResolvedValue({ ok: true, value: summary });
  m.recallSettlement.mockResolvedValue(null);
  m.rememberSettlement.mockResolvedValue();
});

describe('useSettlementScreen', () => {
  it('precarga lo cobrado y avisa que no cuadra', async () => {
    const { result } = await ready();
    expect(result.current).toMatchObject({ expectedLabel: '$100.000', collectedLabel: '$90.000', differenceText: 'Faltan $10.000', needsNote: true, locked: false, notice: null });
    expect(result.current.form.cash).toBe('60.000');
  });

  it('pide la nota antes de confirmar si no cuadra', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.requestSubmit();
    });
    expect(result.current.noteError).toMatch(/nota/);
    expect(result.current.confirmOpen).toBe(false);
    await act(async () => {
      result.current.setNote('Un cliente no pagó');
    });
    expect(result.current.noteError).toBeNull();
    await act(async () => {
      result.current.requestSubmit();
    });
    expect(result.current.confirmOpen).toBe(true);
    await act(async () => {
      result.current.cancelConfirm();
    });
    expect(result.current.confirmOpen).toBe(false);
  });

  it('envía, recuerda el id y queda de solo lectura', async () => {
    a.postSettlement.mockResolvedValue({ ok: true, value: settlement('PENDING') });
    const { result } = await ready();
    await act(async () => {
      result.current.setNote('Un cliente no pagó');
    });
    await act(async () => {
      result.current.requestSubmit();
    });
    await act(async () => {
      result.current.confirmSubmit();
    });
    await waitFor(() => {
      expect(result.current.locked).toBe(true);
    });
    expect(a.postSettlement).toHaveBeenCalledWith({ expectedAmount: 100000, collectedCash: 60000, collectedNequi: 30000, collectedTransfer: 0, collectorNote: 'Un cliente no pagó' });
    expect(m.rememberSettlement).toHaveBeenCalledWith('u1', '2026-10-09', 's1');
    expect(result.current.notice).toMatchObject({ status: 'PENDING', title: 'Enviado' });
  });

  it('muestra los montos editados', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.setAmount('cash', '70000');
    });
    expect(result.current).toMatchObject({ collectedLabel: '$100.000', differenceText: 'Cuadra con lo esperado', needsNote: false });
  });

  it('explica el fallo de red y el de sesión vencida', async () => {
    a.postSettlement.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    const { result } = await ready();
    await act(async () => {
      result.current.setAmount('cash', '70000');
    });
    await act(async () => {
      result.current.confirmSubmit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/internet/);
    });
    const expired = { kind: 'http', status: 401, code: null, retryAfterSeconds: null } as const;
    a.postSettlement.mockResolvedValueOnce({ ok: false, failure: expired });
    await act(async () => {
      result.current.confirmSubmit();
    });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalledWith(expired);
    });
    expect(result.current.formError).toMatch(/enviar/);
  });

  it('un cuadre rechazado se puede corregir; uno aprobado no', async () => {
    m.recallSettlement.mockResolvedValue('s1');
    a.fetchSettlement.mockResolvedValue({ ok: true, value: settlement('REJECTED', 'Falta el recibo') });
    const rejected = await ready();
    expect(rejected.result.current).toMatchObject({ locked: false, submitLabel: 'Reenviar cuadre' });
    expect(rejected.result.current.notice).toMatchObject({ status: 'REJECTED', reviewNote: 'Falta el recibo' });
    a.fetchSettlement.mockResolvedValue({ ok: true, value: settlement('APPROVED') });
    const approved = await ready();
    expect(approved.result.current.locked).toBe(true);
  });

  it('marca el fallo de carga y reintenta', async () => {
    a.fetchDailySummary.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await ready();
    expect(result.current.loadFailed).toBe(true);
    a.fetchDailySummary.mockResolvedValue({ ok: true, value: summary });
    await act(async () => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(false);
    });
  });
});
