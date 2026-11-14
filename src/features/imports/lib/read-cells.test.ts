import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { readSheet } from 'read-excel-file/universal';
import { pickAndReadCells } from '@/features/imports/lib/read-cells';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('read-excel-file/universal', () => ({ readSheet: jest.fn() }));

const pick = (name: string) => jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: `file:///${name}`, name, lastModified: 0 }] });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(File).mockImplementation(() => ({ text: () => Promise.resolve('Cédula,Nombre\n1,Ana'), arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)) }) as unknown as File);
});

describe('pickAndReadCells', () => {
  it('reports a cancelled picker', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });

    expect(await pickAndReadCells()).toEqual({ kind: 'cancelled' });
  });

  it('reads a csv as text', async () => {
    pick('Hoja.CSV');

    expect(await pickAndReadCells()).toEqual({ kind: 'cells', cells: [['Cédula', 'Nombre'], ['1', 'Ana']] });
  });

  it('reads an xlsx with read-excel-file', async () => {
    pick('hoja.xlsx');
    jest.mocked(readSheet).mockResolvedValue([['a']] as never);

    expect(await pickAndReadCells()).toEqual({ kind: 'cells', cells: [['a']] });
  });

  it('rejects any other extension', async () => {
    pick('hoja.pdf');

    expect(await pickAndReadCells()).toEqual({ kind: 'format' });
  });
});
