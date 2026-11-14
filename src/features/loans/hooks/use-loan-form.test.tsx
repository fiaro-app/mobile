import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as clientsApi from '@/features/clients/api/clients-api';
import * as api from '@/features/loans/api/loans-api';
import { useLoanForm } from '@/features/loans/hooks/use-loan-form';
import * as team from '@/features/team/api/team-api';
import * as riskApi from '@/features/risk/api/risk-api';

jest.mock('@/features/risk/api/risk-api', () => ({ fetchClientsRisk: jest.fn() }));
jest.mock('@/features/loans/api/loans-api', () => ({ createLoan: jest.fn(), assignCollector: jest.fn() }));
jest.mock('@/features/clients/api/clients-api', () => ({ fetchClientById: jest.fn() }));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/business-date', () => ({ ...jest.requireActual('@/lib/business-date'), businessDateOf: () => '2026-10-09' }));

const a = jest.mocked(api);
const loan = { id: 'l9', clientId: 'c1', principalAmount: 1, installmentCount: 1, installmentValue: 1, totalPayable: 1, frequency: 'DAILY' as const, startDate: '2026-10-09', status: 'ACTIVE' as const, closedAt: null };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(riskApi).fetchClientsRisk.mockResolvedValue({ ok: true, value: [] });
  jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: [{ id: 'm1', userId: 'u', fullName: 'Ana Gómez', phone: '+573001234567', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: null }] });
  jest.mocked(clientsApi).fetchClientById.mockResolvedValue({ ok: true, value: { id: 'c1', nationalId: '1020304050', fullName: 'Marta Gómez', occupation: 'x', phone: '+573001112233', address: 'y' } });
});

async function fill(result: { current: ReturnType<typeof useLoanForm> }) {
  await act(async () => {
    result.current.setAmount('principal', '1000000');
    result.current.setCount('30');
    result.current.setAmount('installment', '35000');
    result.current.setFrequency('DAILY');
  });
}

describe('useLoanForm', () => {
  it('sugiere el total hasta que se edita a mano', async () => {
    const { result } = await renderHook(() => useLoanForm('c1', jest.fn()), { wrapper });
    await fill(result);
    expect(result.current.values.total).toBe('1.050.000');
    expect(result.current.totalSuggested).toBe(true);
    await act(async () => {
      result.current.setAmount('total', '1200000');
    });
    await act(async () => {
      result.current.setCount('20');
    });
    expect(result.current.values).toMatchObject({ count: '20', total: '1.200.000' });
    expect(result.current.totalSuggested).toBe(false);
  });

  it('muestra etiquetas y abre y cierra hojas', async () => {
    const { result } = await renderHook(() => useLoanForm('c1', jest.fn()), { wrapper });
    await waitFor(() => {
      expect(result.current.clientLabel).toBe('Marta Gómez');
    });
    expect(result.current).toMatchObject({ frequencyLabel: 'Elige la frecuencia', startDateLabel: 'Hoy · vie 9 oct', collectorLabel: 'Sin asignar por ahora' });
    await act(async () => {
      result.current.openSheet('collector');
    });
    expect(result.current.sheet).toBe('collector');
    await act(async () => {
      result.current.setCollector('m1');
    });
    expect(result.current).toMatchObject({ collectorLabel: 'Ana Gómez', sheet: 'none' });
    await act(async () => {
      result.current.setStartDate('2026-10-10');
      result.current.openSheet('client');
      result.current.setClient('c1');
      result.current.closeSheet();
    });
    expect(result.current.values.startDate).toBe('2026-10-10');
  });

  it('valida antes de enviar', async () => {
    const { result } = await renderHook(() => useLoanForm('', jest.fn()), { wrapper });
    await act(async () => {
      result.current.submit();
    });
    expect(result.current.errors.clientId).toBeDefined();
    expect(result.current.clientLabel).toBe('Elige un cliente');
    expect(a.createLoan).not.toHaveBeenCalled();
  });

  it('crea, asigna el cobrador y abre el préstamo', async () => {
    a.createLoan.mockResolvedValue({ ok: true, value: loan });
    a.assignCollector.mockResolvedValue({ ok: true, value: { id: 'a', loanId: 'l9', collectorMembershipId: 'm1', effectiveFrom: '2026-10-09', effectiveTo: null } });
    const created = jest.fn();
    const { result } = await renderHook(() => useLoanForm('c1', created), { wrapper });
    await fill(result);
    await act(async () => {
      result.current.setCollector('m1');
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(created).toHaveBeenCalledWith('l9');
    });
    expect(a.assignCollector).toHaveBeenCalledWith('l9', 'm1');
  });

  it('si no se pudo asignar, avisa y no deja crear otro', async () => {
    a.createLoan.mockResolvedValue({ ok: true, value: loan });
    a.assignCollector.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useLoanForm('c1', jest.fn()), { wrapper });
    await fill(result);
    await act(async () => {
      result.current.setCollector('m1');
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.createdLoanId).toBe('l9');
    });
    expect(result.current.formError).toMatch(/no pudimos asignarle/);
    await act(async () => {
      result.current.submit();
    });
    expect(a.createLoan).toHaveBeenCalledTimes(1);
  });

  it('explica un fallo al crear', async () => {
    a.createLoan.mockResolvedValue({ ok: false, failure: { kind: 'http', status: 403, code: 'SUBSCRIPTION_READ_ONLY', retryAfterSeconds: null } });
    const { result } = await renderHook(() => useLoanForm('c1', jest.fn()), { wrapper });
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/solo lectura/);
    });
    expect(result.current.submitting).toBe(false);
  });

  it('avisa, sin bloquear, cuando el cliente elegido tiene riesgo muy alto', async () => {
    jest.mocked(riskApi).fetchClientsRisk.mockResolvedValue({ ok: true, value: [{ clientId: 'c1', score: 90, level: 'VERY_HIGH', loansCount: 2, factors: [] }] });
    const { result } = await renderHook(() => useLoanForm('c1', jest.fn()), { wrapper });

    await waitFor(() => { expect(result.current.riskWarning).toMatch(/riesgo muy alto/i); });
    expect(result.current.risk).toMatchObject({ score: 90, level: 'VERY_HIGH' });
  });

  it('sin riesgo muy alto no hay aviso', async () => {
    const { result } = await renderHook(() => useLoanForm('c1', jest.fn()), { wrapper });

    await waitFor(() => { expect(jest.mocked(riskApi).fetchClientsRisk).toHaveBeenCalled(); });
    expect(result.current.riskWarning).toBeNull();
    expect(result.current.risk).toBeNull();
  });
});
