import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as clientsApi from '@/features/clients/api/clients-api';
import * as api from '@/features/loans/api/loans-api';
import { useLoanCalendar } from '@/features/loans/hooks/use-loan-calendar';
import { useLoanDetail } from '@/features/loans/hooks/use-loan-detail';
import { useLoanHistory } from '@/features/loans/hooks/use-loan-history';
import { useLoansScreen } from '@/features/loans/hooks/use-loans-screen';
import * as team from '@/features/team/api/team-api';

jest.mock('@/features/loans/api/loans-api', () => ({
  fetchLoans: jest.fn(), fetchLoan: jest.fn(), fetchLoanBalance: jest.fn(), fetchInstallments: jest.fn(), fetchAssignments: jest.fn(), fetchLoanVisits: jest.fn(),
  assignCollector: jest.fn(), cancelLoan: jest.fn(), reversePayment: jest.fn(),
}));
jest.mock('@/features/clients/api/clients-api', () => ({ fetchClientById: jest.fn() }));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/business-date', () => ({ ...jest.requireActual('@/lib/business-date'), businessDateOf: () => '2026-10-09' }));

const a = jest.mocked(api);
const loanItem = (id: string, over = {}) => ({ id, clientId: `c-${id}`, principalAmount: 1000000, installmentCount: 30, installmentValue: 35000, totalPayable: 1050000, frequency: 'DAILY' as const, startDate: '2026-09-02', status: 'ACTIVE' as const, closedAt: null, balance: 420000, overdueAmount: 0, overdueDays: 0, nextDueDate: null, ...over });
const balance = { loanId: 'l1', balance: 420000, totalExpectedToDate: 0, overdueAmount: 105000, overdueDays: 3, nextDueDate: null, firstOverdueDate: null };
const members = [
  { id: 'm1', userId: 'u1', fullName: 'Ana Gómez', phone: '+573001234567', roles: ['COLLECTOR' as const], status: 'ACTIVE' as const, portfolioId: null },
  { id: 'm2', userId: 'u2', fullName: 'Luis Díaz', phone: '+573115550102', roles: ['COLLECTOR' as const], status: 'INACTIVE' as const, portfolioId: null },
];
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: members });
  jest.mocked(clientsApi).fetchClientById.mockImplementation((id) => Promise.resolve({ ok: true, value: { id, nationalId: '1020304050', fullName: `Cliente ${id}`, occupation: 'x', phone: '+573001112233', address: 'y' } }));
  a.fetchLoans.mockResolvedValue({ ok: true, value: { items: [loanItem('1'), loanItem('2', { overdueDays: 20 })], total: 2 } });
  a.fetchLoan.mockResolvedValue({ ok: true, value: loanItem('l1') });
  a.fetchLoanBalance.mockResolvedValue({ ok: true, value: balance });
  a.fetchAssignments.mockResolvedValue({ ok: true, value: [{ id: 'a1', loanId: 'l1', collectorMembershipId: 'm1', effectiveFrom: '2026-09-01', effectiveTo: null }] });
});

describe('useLoansScreen', () => {
  it('lista con el nombre del cliente y filtra por mora y por búsqueda', async () => {
    const { result } = await renderHook(() => useLoansScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows.map((row) => row.title)).toEqual(['Cliente c-1', 'Cliente c-2']);
    });
    await act(async () => {
      result.current.setFilter('arrears');
    });
    await waitFor(() => {
      expect(result.current.rows.map((row) => row.id)).toEqual(['2']);
    });
    expect(a.fetchLoans).toHaveBeenLastCalledWith(1, 'ACTIVE');
    await act(async () => {
      result.current.setSearch('zzz');
    });
    expect(result.current.empty).toBe('no-results');
  });

  it('pide más páginas y distingue vacío y error', async () => {
    a.fetchLoans.mockImplementation((page) => Promise.resolve({ ok: true, value: { items: [loanItem(String(page))], total: 2 } }));
    const { result } = await renderHook(() => useLoansScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    a.fetchLoans.mockResolvedValue({ ok: true, value: { items: [], total: 0 } });
    const empty = await renderHook(() => useLoansScreen(), { wrapper });
    await waitFor(() => {
      expect(empty.result.current.empty).toBe('no-loans');
    });
    a.fetchLoans.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useLoansScreen(), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.empty).toBe('error');
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});

describe('useLoanDetail', () => {
  const ready = async () => {
    const hook = await renderHook(() => useLoanDetail('l1'), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.model).not.toBeNull();
    });
    return hook;
  };

  it('arma el modelo con saldo, progreso, mora y cobrador', async () => {
    const { result } = await ready();
    expect(result.current.model).toMatchObject({
      clientName: 'Cliente c-l1', balance: '$420.000', percent: 60, progress: '60 % pagado · 18 de 30 cuotas', collectorName: 'Ana Gómez', canCancel: true, badge: { label: 'ATRASO' },
    });
    expect(result.current.model?.rows.map((row) => row.label)).toEqual(['Cuota', 'Inicio', 'Vencido']);
    expect(result.current.collectorOptions).toEqual([{ value: 'm1', label: 'Ana Gómez' }]);
  });

  it('asigna un cobrador y avisa', async () => {
    a.assignCollector.mockResolvedValue({ ok: true, value: { id: 'a2', loanId: 'l1', collectorMembershipId: 'm1', effectiveFrom: '2026-10-09', effectiveTo: null } });
    const { result } = await ready();
    await act(async () => {
      result.current.openDialog('assign');
    });
    expect(result.current.dialog).toBe('assign');
    await act(async () => {
      result.current.assign('m1');
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cobrador asignado.');
    });
    expect(result.current.dialog).toBe('none');
  });

  it('anula, explica los fallos y cierra la sesión vencida', async () => {
    a.cancelLoan.mockResolvedValueOnce(http(409, 'LOAN_NOT_CANCELABLE'));
    const { result } = await ready();
    await act(async () => {
      result.current.confirmCancel();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/dejó de estar activo/);
    });
    a.cancelLoan.mockResolvedValueOnce(http(401));
    await act(async () => {
      result.current.confirmCancel();
    });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    });
    a.cancelLoan.mockResolvedValueOnce({ ok: true, value: loanItem('l1', { status: 'CANCELED' }) });
    await act(async () => {
      result.current.confirmCancel();
      result.current.closeDialog();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Préstamo anulado.');
    });
  });

  it('un préstamo anulado no se puede anular y sin cobrador lo dice', async () => {
    a.fetchLoan.mockResolvedValue({ ok: true, value: loanItem('l1', { status: 'CANCELED' }) });
    a.fetchAssignments.mockResolvedValue({ ok: true, value: [] });
    const { result } = await ready();
    expect(result.current.model).toMatchObject({ canCancel: false, collectorName: null, badge: { label: 'ANULADO' } });
  });

  it('distingue no encontrado y error de carga, y refresca', async () => {
    a.fetchLoan.mockResolvedValue(http(404, 'NOT_FOUND'));
    const notFound = await renderHook(() => useLoanDetail('x'), { wrapper });
    await waitFor(() => {
      expect(notFound.result.current.notFound).toBe(true);
    });
    a.fetchLoan.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useLoanDetail('y'), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});

describe('useLoanCalendar', () => {
  it('arma filas y resumen', async () => {
    a.fetchInstallments.mockResolvedValue({ ok: true, value: [{ number: 1, dueDate: '2026-09-02', expectedAmount: 100, paidAmount: 100, status: 'PAID' }] });
    const { result } = await renderHook(() => useLoanCalendar('l1'), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.summary).toBe('1 de 1 pagadas');
    a.fetchInstallments.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useLoanCalendar('z'), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});

describe('useLoanHistory', () => {
  const visits = [
    { id: 'v1', collectorMembershipId: 'm1', outcome: 'PAID' as const, promisedDate: null, occurredAt: '2026-09-24T21:00:00Z', payment: { id: 'p1', amount: 35000, method: 'CASH' as const, reversal: null } },
    { id: 'v2', collectorMembershipId: 'm1', outcome: 'NOT_FOUND' as const, promisedDate: null, occurredAt: '2026-09-25T21:00:00Z', payment: null },
  ];
  const ready = async () => {
    a.fetchLoanVisits.mockResolvedValue({ ok: true, value: visits });
    const hook = await renderHook(() => useLoanHistory('l1'), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.rows).toHaveLength(2);
    });
    return hook;
  };

  it('ordena de la más reciente a la más antigua', async () => {
    const { result } = await ready();
    expect(result.current.rows.map((row) => row.id)).toEqual(['v2', 'v1']);
  });

  it('exige motivo y revierte el pago', async () => {
    a.reversePayment.mockResolvedValue({ ok: true, value: {} });
    const { result } = await ready();
    await act(async () => {
      result.current.startReverse(result.current.rows[0]!);
    });
    expect(result.current.reversing).toBeNull();
    await act(async () => {
      result.current.startReverse(result.current.rows[1]!);
    });
    expect(result.current.reversing).toEqual({ paymentId: 'p1', amount: '$35.000' });
    await act(async () => {
      result.current.confirmReverse();
    });
    expect(result.current.reasonError).toMatch(/motivo/);
    await act(async () => {
      result.current.setReason('Error de digitación');
    });
    expect(result.current.reasonError).toBeNull();
    await act(async () => {
      result.current.confirmReverse();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Pago revertido.');
    });
    expect(a.reversePayment).toHaveBeenCalledWith('p1', 'Error de digitación');
    expect(result.current.reversing).toBeNull();
  });

  it('explica el fallo y permite cancelar', async () => {
    a.reversePayment.mockResolvedValue(http(409, 'CONFLICT'));
    const { result } = await ready();
    await act(async () => {
      result.current.startReverse(result.current.rows[1]!);
      result.current.setReason('x');
    });
    await act(async () => {
      result.current.confirmReverse();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/ya estaba revertido/);
    });
    await act(async () => {
      result.current.startReverse(result.current.rows[1]!);
      result.current.cancelReverse();
    });
    expect(result.current.reversing).toBeNull();
  });

  it('marca el fallo de carga y refresca', async () => {
    a.fetchLoanVisits.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useLoanHistory('l1'), { wrapper });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      result.current.refresh();
    });
  });
});
