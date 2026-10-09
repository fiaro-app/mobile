import { renderHook } from '@testing-library/react-native';
import * as detailHook from '@/features/client-detail/hooks/use-client-detail';
import { useClientDetailScreen } from '@/features/client-detail/hooks/use-client-detail-screen';
import * as call from '@/features/client-detail/lib/call';
import type { ClientDetailModel } from '@/features/client-detail/lib/detail-view-model';

jest.mock('@/features/client-detail/hooks/use-client-detail', () => ({ useClientDetail: jest.fn() }));
jest.mock('@/features/client-detail/lib/call', () => ({ callClient: jest.fn().mockResolvedValue(true) }));

const useDetail = jest.mocked(detailHook.useClientDetail);
const model = {
  name: 'Marta Gómez', phone: '+57 300 123 4567', phoneDial: '+573001234567', address: 'Cl 1', balanceLabel: '$420.000',
  installmentName: 'Cuota diaria', installmentLabel: '$35.000', overdueLabel: '12 días', overdueAlert: true, nextVisitLabel: 'Hoy',
} as ClientDetailModel;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useClientDetailScreen', () => {
  it('arma las filas con los textos del diseño', async () => {
    useDetail.mockReturnValue({ state: 'ready', model, refreshing: false, refresh: jest.fn() });
    const { result } = await renderHook(() => useClientDetailScreen('c1', 'l1'));
    expect(result.current.title).toBe('Marta Gómez');
    expect(result.current.rows.map((row) => row.label)).toEqual(['Teléfono', 'Dirección', 'Saldo actual', 'Cuota diaria', 'Días de mora', 'Próxima visita']);
    expect(result.current.rows[4]).toMatchObject({ value: '12 días', alert: true });
  });

  it('llama al teléfono del cliente', async () => {
    useDetail.mockReturnValue({ state: 'ready', model, refreshing: false, refresh: jest.fn() });
    const { result } = await renderHook(() => useClientDetailScreen('c1', 'l1'));
    result.current.call();
    expect(call.callClient).toHaveBeenCalledWith('+573001234567');
  });

  it('sin datos usa el título genérico, no llama y explica el fallo', async () => {
    useDetail.mockReturnValue({ state: 'offline', model: null, refreshing: false, refresh: jest.fn() });
    const { result } = await renderHook(() => useClientDetailScreen('c1', 'l1'));
    expect(result.current).toMatchObject({ title: 'Cliente', rows: [] });
    expect(result.current.empty.title).toBe('Sin conexión');
    result.current.call();
    expect(call.callClient).not.toHaveBeenCalled();
  });
});
