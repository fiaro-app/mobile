import { fireEvent, render, screen } from '@testing-library/react-native';
import { LenderStatsView, type LenderStatsViewProps } from '@/components/organisms/LenderStatsView';

jest.mock('@/components/atoms/LoadingDots', () => ({ LoadingDots: () => null }));

const BASE: LenderStatsViewProps = {
  periods: [{ value: 'month', label: 'Mes' }],
  period: 'month',
  onPeriod: jest.fn(),
  dates: { range: { from: '', to: '' }, onOpen: jest.fn(), onClear: jest.fn(), hint: 'O elige fechas' },
  collector: { label: 'Todos los cobradores', active: false, onOpen: jest.fn() },
  portfolio: { label: 'Todas las carteras', active: false, onOpen: jest.fn() },
  periodLabel: 'Octubre',
  kpis: [{ key: 'portfolio', label: 'Cartera total', value: '$18M', tone: 'neutral', trend: null }],
  bucketsTitle: 'Mora por antigüedad',
  buckets: [{ label: '0-7', amount: '$100.000', clients: '1 cliente', percent: 20 }],
  topTitle: 'Mayores morosos',
  top: [{ id: 'c1', name: 'Marta Gómez', days: '17 días', amount: '$336.000' }],
  collectorsTitle: 'Desempeño por cobrador',
  collectors: [{ id: 'm1', name: 'Ana Gómez', effectiveness: '95 %', tone: 'good', overdue: '$0' }],
  empty: null,
  exportPdf: { label: 'Exportar PDF', busy: false, error: null, onPress: jest.fn() },
  refreshing: false,
  onRefresh: jest.fn(),
  sheets: null,
};

describe('LenderStatsView según el plan', () => {
  it('con el plan completo muestra el PDF, la mora y el desempeño', async () => {
    await render(<LenderStatsView {...BASE} />);

    expect(screen.getByText('Exportar PDF')).toBeOnTheScreen();
    expect(screen.getByText('Mora por antigüedad')).toBeOnTheScreen();
    expect(screen.getByText('Mayores morosos')).toBeOnTheScreen();
    expect(screen.getByText('Desempeño por cobrador')).toBeOnTheScreen();
  });

  it('en Individual deja solo los indicadores y ofrece ver los planes', async () => {
    const onPress = jest.fn();
    await render(
      <LenderStatsView {...BASE} exportPdf={null} upgrade={{ message: 'Estadísticas completas desde el plan Pro', action: { label: 'Ver planes en la web', onPress } }} />,
    );

    expect(screen.getByText('$18M')).toBeOnTheScreen();
    expect(screen.queryByText('Exportar PDF')).toBeNull();
    expect(screen.queryByText('Mora por antigüedad')).toBeNull();
    expect(screen.queryByText('Mayores morosos')).toBeNull();
    expect(screen.queryByText('Desempeño por cobrador')).toBeNull();

    await fireEvent.press(screen.getByRole('link', { name: 'Ver planes en la web' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
