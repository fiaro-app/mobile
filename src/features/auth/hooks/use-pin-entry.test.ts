import { act, renderHook } from '@testing-library/react-native';
import { usePinEntry } from '@/features/auth/hooks/use-pin-entry';

async function typeDigits(result: { current: ReturnType<typeof usePinEntry> }, digits: string) {
  for (const digit of digits) {
    await act(async () => {
      result.current.press(digit);
    });
  }
}

describe('usePinEntry', () => {
  it('acumula dígitos sin avisar antes de completar', async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => usePinEntry(onComplete));
    await typeDigits(result, '123');
    expect(result.current.digits).toBe('123');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('avisa una sola vez con el PIN completo', async () => {
    const onComplete = jest.fn().mockResolvedValue(false);
    const { result } = await renderHook(() => usePinEntry(onComplete));
    await typeDigits(result, '1234');
    await typeDigits(result, '5');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(result.current.digits).toBe('1234');
  });

  it('limpia los puntos cuando onComplete devuelve true', async () => {
    const { result } = await renderHook(() => usePinEntry(() => true));
    await typeDigits(result, '1234');
    expect(result.current.digits).toBe('');
    expect(result.current.busy).toBe(false);
  });

  it('borra el último dígito y se puede reiniciar', async () => {
    const { result } = await renderHook(() => usePinEntry(jest.fn()));
    await typeDigits(result, '12');
    await act(async () => {
      result.current.backspace();
    });
    expect(result.current.digits).toBe('1');
    await act(async () => {
      result.current.reset();
    });
    expect(result.current.digits).toBe('');
  });

  it('ignora las teclas mientras verifica', async () => {
    let finish: (reset: boolean) => void = () => undefined;
    const pending = new Promise<boolean>((resolve) => {
      finish = resolve;
    });
    const onComplete = jest.fn().mockReturnValue(pending);
    const { result } = await renderHook(() => usePinEntry(onComplete));
    await typeDigits(result, '1234');
    expect(result.current.busy).toBe(true);
    await typeDigits(result, '9');
    await act(async () => {
      result.current.backspace();
    });
    expect(result.current.digits).toBe('1234');
    await act(async () => {
      finish(true);
      await pending;
    });
    expect(result.current.digits).toBe('');
  });
});
