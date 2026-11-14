import { fireEvent, render, screen } from '@testing-library/react-native';
import { ImportView, type ImportViewState, type ImportViewTexts } from '@/components/organisms/ImportView';

jest.mock('@/components/atoms/LoadingDots', () => ({ LoadingDots: () => null }));

const TEXTS: ImportViewTexts = {
  intro: { description: 'Sube tu hoja', steps: ['1. Plantilla'], template: 'Compartir plantilla', pick: 'Elegir archivo' },
  working: { reading: 'Leyendo', reviewing: 'Revisando', importing: 'Importando' },
  review: { title: 'Esto se importaría', ready: (n) => `${String(n)} listas`, invalid: (n) => `${String(n)} con errores`, confirm: (n) => `Importar ${String(n)}`, cancel: 'Otro archivo', nothing: 'Nada listo' },
  done: { title: 'Terminó', summary: (i, f) => `${String(i)} ok ${String(f)} mal`, again: 'Otra hoja', goToClients: 'Ver clientes' },
  problems: { title: 'Filas con problemas', row: (n) => `Fila ${String(n)}` },
};
const handlers = { onPick: jest.fn(), onConfirm: jest.fn(), onReset: jest.fn(), onShareTemplate: jest.fn(), onGoToClients: jest.fn() };
const view = (state: ImportViewState) => render(<ImportView texts={TEXTS} state={state} {...handlers} />);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ImportView', () => {
  it('starts with the instructions, the picker and the template, and shows an error', async () => {
    await view({ phase: 'idle', error: 'Mal archivo' });

    expect(screen.getByText('Mal archivo')).toBeTruthy();
    await fireEvent.press(screen.getByText('Elegir archivo'));
    await fireEvent.press(screen.getByText('Compartir plantilla'));
    expect(handlers.onPick).toHaveBeenCalled();
    expect(handlers.onShareTemplate).toHaveBeenCalled();
  });

  it('says which step is running', async () => {
    await view({ phase: 'working', step: 'reviewing' });

    expect(screen.getByText('Revisando')).toBeTruthy();
  });

  it('lets confirm only when rows are ready and lists the problems', async () => {
    await view({ phase: 'review', items: [{ sheetRow: 2, status: 'READY', problems: [] }, { sheetRow: 3, status: 'INVALID', problems: ['Cédula repetida'] }] });

    expect(screen.getByText('1 listas · 1 con errores')).toBeTruthy();
    expect(screen.getByText('Fila 3')).toBeTruthy();
    await fireEvent.press(screen.getByText('Importar 1'));
    await fireEvent.press(screen.getByText('Otro archivo'));
    expect(handlers.onConfirm).toHaveBeenCalled();
    expect(handlers.onReset).toHaveBeenCalled();
  });

  it('blocks confirming when nothing is ready', async () => {
    await view({ phase: 'review', items: [{ sheetRow: 2, status: 'INVALID', problems: ['x'] }] });
    await fireEvent.press(screen.getByText('Importar 0'));

    expect(handlers.onConfirm).not.toHaveBeenCalled();
  });

  it('shows the result and goes to clients', async () => {
    await view({ phase: 'done', items: [{ sheetRow: 2, status: 'IMPORTED', problems: [] }, { sheetRow: 3, status: 'FAILED', problems: ['Tope'] }] });

    expect(screen.getByText('Terminó. 1 ok 1 mal')).toBeTruthy();
    await fireEvent.press(screen.getByText('Ver clientes'));
    await fireEvent.press(screen.getByText('Otra hoja'));
    expect(handlers.onGoToClients).toHaveBeenCalled();
    expect(handlers.onReset).toHaveBeenCalled();
  });
});
