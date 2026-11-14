import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as callModule from '@/features/client-detail/lib/call';
import * as api from '@/features/clients/api/clients-api';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import { useClientProfile } from '@/features/clients/hooks/use-client-profile';
import { useClientsScreen } from '@/features/clients/hooks/use-clients-screen';
import * as actions from '@/features/auth/store/session-actions';
import * as riskApi from '@/features/risk/api/risk-api';

jest.mock('@/features/risk/api/risk-api', () => ({ fetchClientsRisk: jest.fn() }));
jest.mock('@/features/clients/api/clients-api', () => ({ fetchClients: jest.fn(), fetchClientById: jest.fn(), createClient: jest.fn(), updateClient: jest.fn(), fetchClientLoans: jest.fn(), CLIENTS_PAGE_SIZE: 30 }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/features/client-detail/lib/call', () => ({ callClient: jest.fn() }));

const a = jest.mocked(api);
const row = (id: string, over = {}) => ({ id, nationalId: '1020304050', fullName: `Cliente ${id}`, occupation: 'x', phone: '+573001112233', address: 'y', balance: 100, overdueAmount: 0, overdueDays: 0, activeLoans: 1, ...over });
const client = { id: 'c1', nationalId: '1020304050', fullName: 'Marta Gómez', occupation: 'Comerciante', phone: '+573001112233', address: 'Calle 1' };
const loan = { id: 'l1', clientId: 'c1', principalAmount: 1000000, installmentCount: 30, installmentValue: 35000, totalPayable: 1050000, frequency: 'DAILY' as const, startDate: '2026-09-02', status: 'ACTIVE' as const, closedAt: null, balance: 420000, overdueAmount: 105000, overdueDays: 3, nextDueDate: null };
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(riskApi).fetchClientsRisk.mockResolvedValue({ ok: true, value: [] });
  a.fetchClients.mockResolvedValue({ ok: true, value: { items: [row('1'), row('2', { overdueDays: 20, overdueAmount: 5 })], total: 2 } });
  a.fetchClientById.mockResolvedValue({ ok: true, value: client });
  a.fetchClientLoans.mockResolvedValue({ ok: true, value: [loan] });
});

describe('useClientsScreen', () => {
  it('lista y filtra lo cargado', async () => {
    const { result } = await renderHook(() => useClientsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.rows).toHaveLength(2);
    await act(async () => {
      result.current.setFilter('arrears');
    });
    expect(result.current.rows.map((r) => r.id)).toEqual(['2']);
    await act(async () => {
      result.current.setFilter('current');
    });
    expect(result.current.rows.map((r) => r.id)).toEqual(['1']);
  });

  it('pide más páginas hasta completar el total', async () => {
    a.fetchClients.mockImplementation((page) => Promise.resolve({ ok: true, value: { items: [row(String(page))], total: 2 } }));
    const { result } = await renderHook(() => useClientsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    await act(async () => {
      result.current.loadMore();
    });
    expect(a.fetchClients).toHaveBeenCalledTimes(2);
  });

  it('distingue vacío, sin resultados y error', async () => {
    a.fetchClients.mockResolvedValue({ ok: true, value: { items: [], total: 0 } });
    const empty = await renderHook(() => useClientsScreen(), { wrapper });
    await waitFor(() => {
      expect(empty.result.current.empty).toBe('no-clients');
    });
    await act(async () => {
      empty.result.current.setFilter('arrears');
    });
    expect(empty.result.current.empty).toBe('no-results');
    a.fetchClients.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useClientsScreen(), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.empty).toBe('error');
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});

describe('riesgo en clientes', () => {
  const risk = (clientId: string, level: 'LOW' | 'HIGH') => ({ clientId, score: 60, level, loansCount: 1, factors: [] });

  it('la lista agrega el nivel de riesgo medio o más a quien tiene historial', async () => {
    jest.mocked(riskApi).fetchClientsRisk.mockResolvedValue({ ok: true, value: [risk('1', 'HIGH'), risk('2', 'LOW')] });
    const { result } = await renderHook(() => useClientsScreen(), { wrapper });

    await waitFor(() => { expect(result.current.rows[0]?.detail).toContain('Riesgo alto'); });
    expect(result.current.rows[1]?.detail).not.toContain('Riesgo');
  });

  it('la ficha trae el riesgo del cliente', async () => {
    jest.mocked(riskApi).fetchClientsRisk.mockResolvedValue({ ok: true, value: [risk('c1', 'HIGH')] });
    const { result } = await renderHook(() => useClientProfile('c1'), { wrapper });

    await waitFor(() => { expect(result.current.risk?.levelLabel).toBe('alto'); });
  });
});

describe('useClientForm', () => {
  const fill = async (result: { current: ReturnType<typeof useClientForm> }) => {
    await act(async () => {
      result.current.fullName.onChangeText('Marta Gómez');
      result.current.nationalId.onChangeText('1020304050');
      result.current.phone.onChangeText('3001112233');
      result.current.occupation.onChangeText('Comerciante');
      result.current.address.onChangeText('Calle 1');
    });
  };

  it('registra y avisa con el cliente creado', async () => {
    a.createClient.mockResolvedValue({ ok: true, value: client });
    const created = jest.fn();
    const { result } = await renderHook(() => useClientForm(undefined, created), { wrapper });
    expect(result.current.editing).toBe(false);
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(created).toHaveBeenCalledWith(client);
    });
  });

  it('valida, explica la cédula repetida y cierra sesión vencida', async () => {
    const { result } = await renderHook(() => useClientForm(undefined, jest.fn()), { wrapper });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.fullName.error).toMatch(/nombre/);
    });
    a.createClient.mockResolvedValueOnce(http(409, 'CLIENT_NATIONAL_ID_TAKEN'));
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/esa cédula/);
    });
    a.createClient.mockResolvedValueOnce(http(401));
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    });
  });

  it('edita: precarga, no envía sin cambios y guarda solo lo cambiado', async () => {
    a.updateClient.mockResolvedValue({ ok: true, value: { ...client, address: 'Otra' } });
    const { result } = await renderHook(() => useClientForm('c1', jest.fn()), { wrapper });
    await waitFor(() => {
      expect(result.current.fullName.value).toBe('Marta Gómez');
    });
    expect(result.current.editing).toBe(true);
    expect(result.current.phone.value).toBe('300 111 2233');
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.notice).toMatch(/No hay cambios/);
    });
    expect(a.updateClient).not.toHaveBeenCalled();
    await act(async () => {
      result.current.address.onChangeText('Otra');
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cambios guardados.');
    });
    expect(a.updateClient).toHaveBeenCalledWith('c1', { address: 'Otra' });
  });

  it('un cliente que no existe se marca como no encontrado', async () => {
    a.fetchClientById.mockResolvedValue(http(404, 'NOT_FOUND'));
    const { result } = await renderHook(() => useClientForm('nadie', jest.fn()), { wrapper });
    await waitFor(() => {
      expect(result.current.notFound).toBe(true);
    });
  });
});

describe('useClientProfile', () => {
  it('arma la ficha con el estado del peor préstamo vigente', async () => {
    a.fetchClientLoans.mockResolvedValue({ ok: true, value: [loan, { ...loan, id: 'l2', overdueDays: 20 }] });
    const { result } = await renderHook(() => useClientProfile('c1'), { wrapper });
    await waitFor(() => {
      expect(result.current.loansLoading).toBe(false);
    });
    expect(result.current.client).toMatchObject({ name: 'Marta Gómez', phone: '300 111 2233', badge: { label: 'MORA' } });
    expect(result.current.loans).toHaveLength(2);
  });

  it('sin préstamos vigentes dice sin deuda', async () => {
    a.fetchClientLoans.mockResolvedValue({ ok: true, value: [] });
    const { result } = await renderHook(() => useClientProfile('c1'), { wrapper });
    await waitFor(() => {
      expect(result.current.client?.badge.label).toBe('SIN DEUDA');
    });
  });

  it('llama y avisa si no se puede', async () => {
    jest.mocked(callModule.callClient).mockResolvedValue(false);
    const { result } = await renderHook(() => useClientProfile('c1'), { wrapper });
    await waitFor(() => {
      expect(result.current.client).not.toBeNull();
    });
    await act(async () => {
      result.current.call();
    });
    await waitFor(() => {
      expect(result.current.notice).toMatch(/no puede hacer llamadas/);
    });
    expect(callModule.callClient).toHaveBeenCalledWith('+573001112233');
    jest.mocked(callModule.callClient).mockResolvedValue(true);
    await act(async () => {
      result.current.call();
    });
    await waitFor(() => {
      expect(result.current.notice).toBeNull();
    });
  });

  it('distingue no encontrado y error', async () => {
    a.fetchClientById.mockResolvedValue(http(404, 'NOT_FOUND'));
    const notFound = await renderHook(() => useClientProfile('x'), { wrapper });
    await waitFor(() => {
      expect(notFound.result.current.notFound).toBe(true);
    });
    a.fetchClientById.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useClientProfile('y'), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});
