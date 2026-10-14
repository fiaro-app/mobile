import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/client-detail/api/client-detail-api';
import { useClientDetail } from '@/features/client-detail/hooks/use-client-detail';
import * as actions from '@/features/auth/store/session-actions';

jest.mock('@/features/client-detail/api/client-detail-api', () => ({
  fetchClient: jest.fn(), fetchLoan: jest.fn(), fetchBalance: jest.fn(), fetchVisits: jest.fn(),
}));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const a = jest.mocked(api);
const client = { id: 'c1', fullName: 'Marta Gómez', occupation: 'x', phone: '+573001234567', address: 'Cl 1' };
const loan = { id: 'l1', clientId: 'c1', installmentValue: 35000, frequency: 'DAILY', status: 'ACTIVE' } as const;
const balance = { loanId: 'l1', balance: 420000, overdueAmount: 1, overdueDays: 3, nextDueDate: null };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function allOk() {
  a.fetchClient.mockResolvedValue({ ok: true, value: client });
  a.fetchLoan.mockResolvedValue({ ok: true, value: loan });
  a.fetchBalance.mockResolvedValue({ ok: true, value: balance });
  a.fetchVisits.mockResolvedValue({ ok: true, value: [] });
}

beforeEach(() => {
  jest.clearAllMocks();
  allOk();
});

describe('useClientDetail', () => {
  it('arma el modelo cuando llegan las cuatro consultas', async () => {
    const { result } = await renderHook(() => useClientDetail('c1', 'l1'), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
    expect(result.current.model).toMatchObject({ name: 'Marta Gómez', balanceLabel: '$420.000', status: 'late' });
  });

  it('clasifica un fallo de red', async () => {
    a.fetchBalance.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useClientDetail('c1', 'l1'), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('offline');
    });
    expect(result.current.model).toBeNull();
  });

  it('distingue mantenimiento y error', async () => {
    a.fetchClient.mockResolvedValue({ ok: false, failure: { kind: 'maintenance' } });
    const maintenance = await renderHook(() => useClientDetail('c1', 'l1'), { wrapper });
    await waitFor(() => {
      expect(maintenance.result.current.state).toBe('maintenance');
    });
    a.fetchClient.mockResolvedValue({ ok: false, failure: { kind: 'http', status: 500, code: null, retryAfterSeconds: null } });
    const error = await renderHook(() => useClientDetail('c2', 'l2'), { wrapper });
    await waitFor(() => {
      expect(error.result.current.state).toBe('error');
    });
  });

  it('un 401 cierra la sesión local', async () => {
    a.fetchLoan.mockResolvedValue({ ok: false, failure: { kind: 'http', status: 401, code: 'UNAUTHENTICATED', retryAfterSeconds: null } });
    await renderHook(() => useClientDetail('c1', 'l1'), { wrapper });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    });
  });

  it('refresca las cuatro consultas', async () => {
    const { result } = await renderHook(() => useClientDetail('c1', 'l1'), { wrapper });
    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
    result.current.refresh();
    await waitFor(() => {
      expect(a.fetchBalance).toHaveBeenCalledTimes(2);
    });
  });
});
