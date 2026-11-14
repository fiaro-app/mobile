import { fireEvent, render, screen } from '@testing-library/react-native';
import { PlanView, type PlanViewProps } from '@/components/organisms/PlanView';

jest.mock('@/components/atoms/LoadingDots', () => ({ LoadingDots: () => null }));

const BASE: PlanViewProps = {
  texts: { current: 'Tu plan', offers: 'Planes', offersHint: 'hint', perMonth: '/ mes', history: 'Historial', historyEmpty: 'Nada', payOnWeb: 'Pagar en la web', payHint: 'hint', supportAction: 'Escribir a soporte prioritario' },
  plan: { rows: [{ label: 'Plan', value: 'Team' }], bars: [], notice: null },
  currentCode: 'TEAM',
  offers: [],
  payments: [],
  paymentsLoading: false,
  refreshing: false,
  onRefresh: jest.fn(),
  onPay: jest.fn(),
};

describe('PlanView · soporte prioritario', () => {
  it('muestra el botón solo cuando hay con qué abrirlo', async () => {
    const onSupport = jest.fn();
    const { rerender } = await render(<PlanView {...BASE} />);
    expect(screen.queryByText('Escribir a soporte prioritario')).toBeNull();

    await rerender(<PlanView {...BASE} onSupport={onSupport} />);
    await fireEvent.press(screen.getByText('Escribir a soporte prioritario'));
    expect(onSupport).toHaveBeenCalledTimes(1);
  });
});
