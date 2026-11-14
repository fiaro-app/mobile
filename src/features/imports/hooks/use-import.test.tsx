import { act, renderHook } from '@testing-library/react-native';
import { useImport } from '@/features/imports/hooks/use-import';
import { pickAndReadCells } from '@/features/imports/lib/read-cells';
import { ImportSendError, sendImport } from '@/features/imports/lib/send-import';

jest.mock('@/features/imports/api/imports-api', () => ({ runImport: jest.fn() }));
jest.mock('@/features/imports/lib/read-cells', () => ({ pickAndReadCells: jest.fn() }));
jest.mock('@/features/imports/lib/send-import', () => ({
  ...jest.requireActual<object>('@/features/imports/lib/send-import'),
  sendImport: jest.fn(),
}));

const HEADER = ['Cédula', 'Nombre', 'Celular'];
const ITEMS = [{ sheetRow: 2, status: 'READY' as const, problems: [] }];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useImport', () => {
  it('reviews the sheet and, only after confirming, imports it', async () => {
    jest.mocked(pickAndReadCells).mockResolvedValue({ kind: 'cells', cells: [HEADER, ['1', 'Ana', '3001112222']] });
    jest.mocked(sendImport).mockResolvedValueOnce(ITEMS).mockResolvedValueOnce([{ ...ITEMS[0]!, status: 'IMPORTED' }]);
    const { result } = await renderHook(() => useImport());

    await act(async () => {
      await result.current.choose();
    });
    expect(result.current.state.phase).toBe('review');
    expect(sendImport).toHaveBeenLastCalledWith(expect.any(Array), true, expect.any(Function));

    await act(async () => {
      await result.current.confirm();
    });
    expect(result.current.state).toEqual({ phase: 'done', items: [{ sheetRow: 2, status: 'IMPORTED', problems: [] }] });
    expect(sendImport).toHaveBeenLastCalledWith(expect.any(Array), false, expect.any(Function));
  });

  it('does nothing when confirming outside the review', async () => {
    const { result } = await renderHook(() => useImport());

    await act(async () => {
      await result.current.confirm();
    });

    expect(sendImport).not.toHaveBeenCalled();
  });

  it.each([
    ['cancelled picker', { kind: 'cancelled' as const }, null],
    ['wrong format', { kind: 'format' as const }, 'Ese archivo no es un .xlsx ni un .csv.'],
    ['empty sheet', { kind: 'cells' as const, cells: [HEADER] }, 'La hoja no tiene filas con datos debajo de los encabezados.'],
    ['missing columns', { kind: 'cells' as const, cells: [['Nombre']] }, 'Faltan estas columnas en la primera fila: Cédula, Celular.'],
  ])('goes back to the start on %s', async (_name, picked, error) => {
    jest.mocked(pickAndReadCells).mockResolvedValue(picked);
    const { result } = await renderHook(() => useImport());

    await act(async () => {
      await result.current.choose();
    });

    expect(result.current.state).toEqual({ phase: 'idle', error });
  });

  it('says the file is unreadable when reading throws', async () => {
    jest.mocked(pickAndReadCells).mockRejectedValue(new Error('zip'));
    const { result } = await renderHook(() => useImport());

    await act(async () => {
      await result.current.choose();
    });

    expect(result.current.state).toMatchObject({ phase: 'idle', error: expect.stringContaining('No pudimos leer') });
  });

  it('shows the plan message when the API denies, and the network one otherwise', async () => {
    jest.mocked(pickAndReadCells).mockResolvedValue({ kind: 'cells', cells: [HEADER, ['1', 'Ana', '3001112222']] });
    jest.mocked(sendImport).mockRejectedValueOnce(new ImportSendError({ kind: 'http', status: 403, code: 'PLAN_FEATURE_UNAVAILABLE', retryAfterSeconds: null }));
    const { result } = await renderHook(() => useImport());

    await act(async () => {
      await result.current.choose();
    });
    expect(result.current.state).toMatchObject({ error: 'Tu plan o tu rol no permite importar.' });

    jest.mocked(sendImport).mockRejectedValueOnce(new ImportSendError({ kind: 'offline' }));
    await act(async () => {
      await result.current.choose();
    });
    expect(result.current.state).toMatchObject({ error: expect.stringContaining('servidor') });
  });

  it('goes back to the start with reset', async () => {
    jest.mocked(pickAndReadCells).mockResolvedValue({ kind: 'format' });
    const { result } = await renderHook(() => useImport());
    await act(async () => {
      await result.current.choose();
    });

    await act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({ phase: 'idle', error: null });
  });
});
