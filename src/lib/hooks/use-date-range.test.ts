import { act, renderHook } from '@testing-library/react-native';
import { DATE_RANGE_LIMITS } from '@/lib/date-range';
import { useDateRange } from '@/lib/hooks/use-date-range';

describe('useDateRange', () => {
  it('abre un extremo, elige y corrige el otro', async () => {
    const { result } = await renderHook(() => useDateRange(DATE_RANGE_LIMITS.visits));
    expect(result.current.applied).toBeNull();
    await act(() => {
      result.current.open('from');
    });
    expect(result.current.editing).toBe('from');
    await act(() => {
      result.current.pick('2026-10-01');
    });
    expect(result.current.applied).toEqual({ from: '2026-10-01', to: '2026-10-01' });
    expect(result.current.editingValue).toBe('2026-10-01');
    await act(() => {
      result.current.close();
      result.current.clear();
    });
    expect(result.current.editing).toBeNull();
    expect(result.current.applied).toBeNull();
  });

  it('sin extremo abierto no cambia nada', async () => {
    const { result } = await renderHook(() => useDateRange(DATE_RANGE_LIMITS.history));
    await act(() => {
      result.current.pick('2026-10-01');
    });
    expect(result.current.applied).toBeNull();
  });
});
