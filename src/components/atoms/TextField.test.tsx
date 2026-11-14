import { fireEvent, render, screen } from '@testing-library/react-native';
import { TextField } from '@/components/atoms/TextField';

describe('TextField', () => {
  it('un campo normal no trae el ojito', async () => {
    await render(<TextField accessibilityLabel="Nombre" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('una contraseña empieza oculta y el ojito la muestra y la vuelve a ocultar', async () => {
    await render(<TextField accessibilityLabel="Contraseña" secureTextEntry />);
    const input = screen.getByLabelText('Contraseña');
    expect(input.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(true);
  });
});
