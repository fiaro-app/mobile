import { act, renderHook } from '@testing-library/react-native';
import { useClientsScreen } from '@/features/route/hooks/use-clients-screen';
import { useRouteScreen } from '@/features/route/hooks/use-route-screen';
import * as routeHook from '@/features/route/hooks/use-route';
import type { RouteEntry } from '@/features/route/lib/route-entry';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/route/hooks/use-route', () => ({ useRoute: jest.fn() }));

const useRoute = jest.mocked(routeHook.useRoute);
const refresh = jest.fn();
const row = (name: string, days: number): RouteEntry => ({
  loanId: name, clientId: name, clientFullName: name, balance: 100000, overdueAmount: days ? 1 : 0, overdueDays: days, nextDueDate: null,
});
const entries = [row('Marta Gómez', 12), row('Carlos Restrepo', 0)];

beforeEach(() => {
  useRoute.mockReturnValue({ state: 'ready', entries, refreshing: false, refresh });
  useSessionStore.getState().signedIn({
    user: { id: '1', fullName: 'Alejo Pérez', phone: '+573001234567', mustChangePassword: false },
    pinEnabled: false,
    pinOfferPending: false,
  });
});

describe('useRouteScreen', () => {
  it('arma las filas y las iniciales de la persona', async () => {
    const { result } = await renderHook(() => useRouteScreen());
    expect(result.current.rows.map((r) => r.name)).toEqual(['Marta Gómez', 'Carlos Restrepo']);
    expect(result.current.userInitials).toBe('AP');
    expect(result.current.loading).toBe(false);
  });

  it('refleja la carga y el estado vacío', async () => {
    useRoute.mockReturnValue({ state: 'loading', entries: [], refreshing: false, refresh });
    const { result } = await renderHook(() => useRouteScreen());
    expect(result.current.loading).toBe(true);
    useRoute.mockReturnValue({ state: 'empty', entries: [], refreshing: false, refresh });
    const empty = await renderHook(() => useRouteScreen());
    expect(empty.result.current.empty.title).toBe('Sin clientes asignados hoy');
  });
});

describe('useClientsScreen', () => {
  it('filtra por rango y muestra su nombre en el selector', async () => {
    const { result } = await renderHook(() => useClientsScreen());
    expect(result.current.rangeLabel).toBe('Rango de mora');
    await act(async () => {
      result.current.search.setRange('8-15');
    });
    expect(result.current.rows.map((r) => r.name)).toEqual(['Marta Gómez']);
    expect(result.current.rangeLabel).toBe('8 a 15 días');
  });

  it('muestra "sin resultados" cuando los filtros no encuentran a nadie', async () => {
    const { result } = await renderHook(() => useClientsScreen());
    await act(async () => {
      result.current.search.setSearch('zzz');
    });
    expect(result.current.rows).toHaveLength(0);
    expect(result.current.empty.title).toBe('Sin resultados');
  });

  it('abre y cierra la hoja de rango', async () => {
    const { result } = await renderHook(() => useClientsScreen());
    await act(async () => {
      result.current.openRangeSheet();
    });
    expect(result.current.rangeSheetOpen).toBe(true);
    await act(async () => {
      result.current.closeRangeSheet();
    });
    expect(result.current.rangeSheetOpen).toBe(false);
  });
});
