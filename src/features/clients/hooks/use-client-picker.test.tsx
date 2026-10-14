import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/clients/api/clients-api';
import { useClientPicker } from '@/features/clients/hooks/use-client-picker';

jest.mock('@/features/clients/api/clients-api', () => ({ fetchClients: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useClientPicker', () => {
  it('no pide nada con la hoja cerrada y busca al abrirla', async () => {
    jest.mocked(api).fetchClients.mockResolvedValue({ ok: true, value: { items: [{ id: 'c1', nationalId: '1020304050', fullName: 'Marta Gómez', occupation: 'x', phone: '+573001112233', address: 'y', balance: 0, overdueAmount: 0, overdueDays: 0, activeLoans: 0 }], total: 1 } });
    const closed = await renderHook(() => useClientPicker(false), { wrapper });
    expect(api.fetchClients).not.toHaveBeenCalled();
    expect(closed.result.current.loading).toBe(false);
    const open = await renderHook(() => useClientPicker(true), { wrapper });
    await waitFor(() => {
      expect(open.result.current.options).toEqual([{ value: 'c1', label: 'Marta Gómez', description: 'CC 1020304050' }]);
    });
    await act(async () => {
      open.result.current.setSearch('mar');
    });
    expect(open.result.current.search).toBe('mar');
  });

  it('marca el fallo', async () => {
    jest.mocked(api).fetchClients.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useClientPicker(true), { wrapper });
    await waitFor(() => {
      expect(result.current.failed).toBe(true);
    });
  });
});
