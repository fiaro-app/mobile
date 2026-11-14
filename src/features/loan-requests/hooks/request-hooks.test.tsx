import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/loan-requests/api/requests-api';
import { useRequestDetail } from '@/features/loan-requests/hooks/use-request-detail';
import { useRequestForm } from '@/features/loan-requests/hooks/use-request-form';
import { useRequestsScreen } from '@/features/loan-requests/hooks/use-requests-screen';
import * as team from '@/features/team/api/team-api';

jest.mock('@/features/loan-requests/api/requests-api', () => ({
  lookupClient: jest.fn(),
  createLoanRequest: jest.fn(),
  fetchLoanRequests: jest.fn(),
  fetchLoanRequestById: jest.fn(),
  approveLoanRequest: jest.fn(),
  rejectLoanRequest: jest.fn(),
}));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/business-date', () => ({ ...jest.requireActual('@/lib/business-date'), businessDateOf: () => '2026-10-15' }));

const a = jest.mocked(api);
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;
const request = (id: string, over = {}) => ({ id, status: 'PENDING' as const, requestedByMembershipId: 'm1', clientId: null, nationalId: '51234567', newClient: { fullName: 'Rosa Pardo', occupation: 'Tendera', phone: '+573001112233', address: 'Calle 1' }, principalAmount: 500_000, installmentCount: 20, installmentValue: 30_000, totalPayable: 600_000, frequency: 'DAILY' as const, startDate: '2026-12-01', resolvedAt: null, rejectionReason: null, loanId: null, createdAt: '2026-10-15T12:00:00Z', ...over });

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(team).fetchMembers.mockResolvedValue({ ok: true, value: [{ id: 'm1', userId: 'u', fullName: 'Luis Gómez', phone: '+573001234567', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: null }] });
  a.fetchLoanRequests.mockResolvedValue({ ok: true, value: { items: [request('r1')], total: 2 } });
  a.fetchLoanRequestById.mockResolvedValue({ ok: true, value: request('r1') });
});

describe('useRequestForm', () => {
  async function fillLoan(result: { current: ReturnType<typeof useRequestForm> }) {
    await act(async () => {
      result.current.setAmount('principal', '500000');
      result.current.setCount('20');
      result.current.setAmount('installment', '30000');
      result.current.setFrequency('DAILY');
    });
  }
  async function search(result: { current: ReturnType<typeof useRequestForm> }, exists: boolean) {
    a.lookupClient.mockResolvedValueOnce({ ok: true, value: exists });
    await act(async () => {
      result.current.setNationalId('51.234.567');
    });
    await act(async () => {
      result.current.search();
    });
    await waitFor(() => {
      expect(result.current.lookup).toBe(exists ? 'exists' : 'new');
    });
  }

  it('no consulta una cédula inválida', async () => {
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await act(async () => {
      result.current.setNationalId('12');
      result.current.search();
    });
    expect(a.lookupClient).not.toHaveBeenCalled();
    expect(result.current.errors.nationalId).toMatch(/cédula válida/);
  });

  it('con una cédula nueva pide los datos del cliente y envía la solicitud', async () => {
    a.createLoanRequest.mockResolvedValue({ ok: true, value: request('r9') });
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await search(result, false);
    await act(async () => {
      result.current.setText('fullName', 'Rosa Pardo');
      result.current.setPhone('3001112233');
      result.current.setText('occupation', 'Tendera');
      result.current.setText('address', 'Calle 1');
    });
    await fillLoan(result);
    expect(result.current.values.total).toBe('600.000');
    expect(result.current.totalSuggested).toBe(true);

    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.sent).toBe(true);
    });
    expect(a.createLoanRequest).toHaveBeenCalledWith(expect.objectContaining({ nationalId: '51234567', client: expect.objectContaining({ fullName: 'Rosa Pardo', phone: '+573001112233' }), totalPayable: 600_000 }));
  });

  it('con un cliente del negocio no manda datos personales, y editar el total deja de sugerirlo', async () => {
    a.createLoanRequest.mockResolvedValue({ ok: true, value: request('r9', { clientId: 'c1', newClient: null }) });
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await search(result, true);
    await fillLoan(result);
    await act(async () => {
      result.current.setAmount('total', '700000');
    });
    await act(async () => {
      result.current.setCount('10');
    });
    expect(result.current.values.total).toBe('700.000');
    expect(result.current.totalSuggested).toBe(false);

    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.sent).toBe(true);
    });
    expect(a.createLoanRequest.mock.calls[0]?.[0]).not.toHaveProperty('client');
  });

  it('cambiar la cédula borra el resultado de la consulta', async () => {
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await search(result, true);
    await act(async () => {
      result.current.setNationalId('51234568');
    });
    expect(result.current.lookup).toBe('idle');
  });

  it('explica un fallo al consultar y no avanza', async () => {
    a.lookupClient.mockResolvedValueOnce(http(500));
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await act(async () => {
      result.current.setNationalId('51234567');
    });
    await act(async () => {
      result.current.search();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/No pudimos completar/);
    });
    expect(result.current.lookup).toBe('idle');
  });

  it('no envía sin consultar la cédula, y marca lo que falta', async () => {
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await act(async () => {
      result.current.submit();
    });
    expect(a.createLoanRequest).not.toHaveBeenCalled();
    await search(result, true);
    await act(async () => {
      result.current.submit();
    });
    expect(result.current.errors.principal).toBeDefined();
    expect(result.current.formError).toMatch(/Revisa los campos/);
  });

  it('explica el fallo al enviar y cierra la sesión vencida', async () => {
    a.createLoanRequest.mockResolvedValueOnce(http(401));
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await search(result, true);
    await fillLoan(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    });
    expect(result.current.sent).toBe(false);
  });

  it('abre y cierra las hojas de frecuencia y de fecha', async () => {
    const { result } = await renderHook(() => useRequestForm(), { wrapper });
    await act(async () => {
      result.current.openSheet('startDate');
    });
    expect(result.current.sheet).toBe('startDate');
    await act(async () => {
      result.current.setStartDate('2026-12-05');
    });
    expect(result.current.sheet).toBe('none');
    await act(async () => {
      result.current.openSheet('frequency');
      result.current.closeSheet();
    });
    expect(result.current.sheet).toBe('none');
    expect(result.current.startDateLabel).toContain('5');
  });
});

describe('useRequestsScreen', () => {
  it('lista pendientes con el nombre del cobrador, cambia de estado y pide más páginas', async () => {
    const { result } = await renderHook(() => useRequestsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows[0]?.subtitle).toContain('Luis Gómez');
    });
    expect(a.fetchLoanRequests).toHaveBeenCalledWith(1, 'PENDING');
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(a.fetchLoanRequests).toHaveBeenCalledWith(2, 'PENDING');
    });
    await act(async () => {
      result.current.setStatus('ALL');
    });
    await waitFor(() => {
      expect(a.fetchLoanRequests).toHaveBeenCalledWith(1, null);
    });
  });

  it('marca el fallo y refresca', async () => {
    a.fetchLoanRequests.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useRequestsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.failed).toBe(true);
    });
    await act(async () => {
      result.current.refresh();
    });
  });
});

describe('useRequestDetail', () => {
  const ready = async () => {
    const hook = await renderHook(() => useRequestDetail('r1'), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.model).not.toBeNull();
    });
    return hook;
  };

  it('arma el detalle', async () => {
    const { result } = await ready();
    expect(result.current.model).toMatchObject({ collectorName: 'Luis Gómez', reviewable: true });
  });

  it('acepta y actualiza el estado', async () => {
    a.approveLoanRequest.mockResolvedValue({ ok: true, value: request('r1', { status: 'APPROVED', loanId: 'l1' }) });
    const { result } = await ready();
    await act(async () => {
      result.current.startDecision('approve');
    });
    expect(result.current.decision).toBe('approve');
    await act(async () => {
      result.current.confirmDecision();
    });
    await waitFor(() => {
      expect(result.current.notice).toMatch(/aceptada/);
    });
    expect(a.approveLoanRequest).toHaveBeenCalledWith('r1');
    expect(result.current.model?.reviewable).toBe(false);
  });

  it('rechaza con motivo', async () => {
    a.rejectLoanRequest.mockResolvedValue({ ok: true, value: request('r1', { status: 'REJECTED', rejectionReason: 'Está en mora' }) });
    const { result } = await ready();
    await act(async () => {
      result.current.startDecision('reject');
      result.current.setNote('Está en mora');
    });
    await act(async () => {
      result.current.confirmDecision();
    });
    await waitFor(() => {
      expect(result.current.notice).toMatch(/rechazada/);
    });
    expect(a.rejectLoanRequest).toHaveBeenCalledWith('r1', 'Está en mora');
  });

  it('explica el conflicto, cierra la sesión vencida y permite cancelar', async () => {
    a.approveLoanRequest.mockResolvedValueOnce(http(409, 'CONFLICT'));
    const { result } = await ready();
    await act(async () => {
      result.current.startDecision('approve');
    });
    await act(async () => {
      result.current.confirmDecision();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/ya fue resuelta/);
    });
    a.approveLoanRequest.mockResolvedValueOnce(http(401));
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

  it('distingue una solicitud que no existe de un fallo de carga, y refresca', async () => {
    a.fetchLoanRequestById.mockResolvedValue(http(404, 'NOT_FOUND'));
    const missing = await renderHook(() => useRequestDetail('r1'), { wrapper });
    await waitFor(() => {
      expect(missing.result.current.notFound).toBe(true);
    });
    a.fetchLoanRequestById.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useRequestDetail('r2'), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});
