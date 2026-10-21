import { fireEvent, render, screen } from '@testing-library/react-native';
import { AlertBanner } from '@/components/molecules/AlertBanner';

describe('AlertBanner', () => {
  it('muestra el aviso, sin acción por defecto', async () => {
    await render(<AlertBanner message="Tu plan vence en 3 días." />);

    expect(screen.getByText('Tu plan vence en 3 días.')).toBeOnTheScreen();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('con una acción, la ofrece como enlace y la ejecuta al pulsarla', async () => {
    const onPress = jest.fn();
    await render(<AlertBanner message="Tu plan venció." kind="error" action={{ label: 'Renovar en la web', onPress }} />);

    await fireEvent.press(screen.getByRole('link', { name: 'Renovar en la web' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
