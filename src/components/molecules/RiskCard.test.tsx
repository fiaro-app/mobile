import { render, screen } from '@testing-library/react-native';
import { RiskCard } from '@/components/molecules/RiskCard';

const BASE = { title: 'Riesgo del cliente', levelLabel: 'muy alto', gauge: { score: 80, tone: 'destructive' as const, label: 'Riesgo muy alto: 80 de 100' }, noFactors: 'Sin señales', noHistory: null };

describe('RiskCard', () => {
  it('dibuja el medidor con 19 de 24 marcas llenas, el nivel y los factores', async () => {
    await render(<RiskCard {...BASE} factors={['Tiene 40 días de atraso.']} />);

    expect(screen.getByLabelText('Riesgo muy alto: 80 de 100')).toBeOnTheScreen();
    expect(screen.getAllByTestId('risk-mark-filled')).toHaveLength(19);
    expect(screen.getAllByTestId('risk-mark-empty')).toHaveLength(5);
    expect(screen.getByText('muy alto')).toBeOnTheScreen();
    expect(screen.getByText('• Tiene 40 días de atraso.')).toBeOnTheScreen();
  });

  it('sin factores lo dice, y sin historial no dibuja el medidor', async () => {
    const { rerender } = await render(<RiskCard {...BASE} factors={[]} />);
    expect(screen.getByText('Sin señales')).toBeOnTheScreen();

    await rerender(<RiskCard {...BASE} factors={[]} noHistory="Sin historial." />);
    expect(screen.getByText('Sin historial.')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Riesgo muy alto: 80 de 100')).toBeNull();
  });
});
