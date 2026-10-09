import { act, renderHook } from '@testing-library/react-native';
import { useClientSearch } from '@/features/route/hooks/use-client-search';
import type { RouteEntry } from '@/features/route/lib/route-entry';

const row = (name: string, days: number): RouteEntry => ({
  loanId: name, clientId: name, clientFullName: name, balance: 1000, overdueAmount: days ? 100 : 0, overdueDays: days, nextDueDate: null,
});
const entries = [row('Marta Gómez', 12), row('Carlos Restrepo', 0), row('Yolanda Pérez', 3)];

describe('useClientSearch', () => {
  it('empieza sin filtros y devuelve todo', async () => {
    const { result } = await renderHook(() => useClientSearch(entries));
    expect(result.current.results).toHaveLength(3);
    expect(result.current.filtered).toBe(false);
  });

  it('aplica búsqueda, estado y rango, y los limpia', async () => {
    const { result } = await renderHook(() => useClientSearch(entries));
    await act(async () => {
      result.current.setSearch('perez');
    });
    expect(result.current.results.map((r) => r.clientFullName)).toEqual(['Yolanda Pérez']);
    expect(result.current.filtered).toBe(true);
    await act(async () => {
      result.current.setSearch('');
      result.current.setStatus('overdue');
    });
    expect(result.current.results.map((r) => r.clientFullName)).toEqual(['Marta Gómez']);
    await act(async () => {
      result.current.setStatus('all');
      result.current.setRange('0-7');
    });
    expect(result.current.results).toHaveLength(2);
    await act(async () => {
      result.current.clear();
    });
    expect(result.current.filtered).toBe(false);
    expect(result.current.results).toHaveLength(3);
  });
});
