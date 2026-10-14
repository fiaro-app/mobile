import { act, renderHook } from '@testing-library/react-native';
import { useMembers } from '@/features/team/hooks/use-members';
import { useCollectorFilter } from '@/lib/hooks/use-collector-filter';

jest.mock('@/features/team/hooks/use-members', () => ({ useMembers: jest.fn() }));

const member = (id: string, fullName: string, roles: string[]) => ({ id, userId: `u-${id}`, fullName, phone: '+573001234567', roles, status: 'ACTIVE', portfolioId: null });

beforeEach(() => {
  jest.mocked(useMembers).mockReturnValue({ data: [member('m1', 'Ana Gómez', ['COLLECTOR']), member('m2', 'Daniel Rojas', ['OWNER'])] } as never);
});

describe('useCollectorFilter', () => {
  it('ofrece todos y solo a quienes cobran, y elige uno cerrando la hoja', async () => {
    const { result } = await renderHook(() => useCollectorFilter());
    expect(result.current.options.map((option) => option.label)).toEqual(['Todos los cobradores', 'Ana Gómez']);
    expect(result.current).toMatchObject({ applied: null, label: 'Todos los cobradores', open: false });
    await act(() => {
      result.current.openSheet();
    });
    expect(result.current.open).toBe(true);
    await act(() => {
      result.current.select('m1');
    });
    expect(result.current).toMatchObject({ applied: 'm1', label: 'Ana Gómez', open: false });
    await act(() => {
      result.current.openSheet();
      result.current.closeSheet();
    });
    expect(result.current.open).toBe(false);
  });

  it('sin colaboradores cargados ofrece solo «todos»', async () => {
    jest.mocked(useMembers).mockReturnValue({ data: undefined } as never);
    const { result } = await renderHook(() => useCollectorFilter());
    expect(result.current.options).toHaveLength(1);
  });
});
