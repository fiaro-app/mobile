import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button, DOUBLE_TAP_WINDOW_MS } from '@/components/atoms/Button';

jest.mock('@/components/atoms/LoadingDots', () => ({ LoadingDots: () => null }));

describe('Button', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('un doble toque cuenta como uno', async () => {
    jest.useFakeTimers({ now: 1_000_000 });
    const onPress = jest.fn();
    await render(<Button label="Confirmar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pasada la ventana, un nuevo toque vuelve a contar', async () => {
    jest.useFakeTimers({ now: 1_000_000 });
    const onPress = jest.fn();
    await render(<Button label="Confirmar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));
    jest.setSystemTime(1_000_000 + DOUBLE_TAP_WINDOW_MS + 1);
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar' }));

    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
