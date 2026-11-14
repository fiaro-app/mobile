import { parseCsv } from '@/features/imports/lib/parse-csv';
import { MAX_SHEET_ROWS, parseSheet, templateCsv, type Cell } from '@/features/imports/lib/parse-sheet';

const HEADER = ['Cédula', 'Nombre', 'Ocupación', 'Celular', 'Dirección', 'Cuotas que faltan', 'Valor de la cuota', 'Frecuencia', 'Próxima cuota', 'Capital pendiente', 'Celular del cobrador'];
const FULL: Cell[] = ['1098765432', 'María Pérez', 'Tendera', '3001234567', 'Calle 1', 10, 30000, 'Semanal', '03/11/2026', '$ 300.000', '3009876543'];

function rowsOf(...body: Cell[][]) {
  const parsed = parseSheet([HEADER, ...body]);
  if (parsed.kind !== 'ok') throw new Error(parsed.kind);
  return parsed.rows;
}

describe('parseSheet', () => {
  it('reads a client with its loan, accepting local dates and pesos with separators', () => {
    expect(rowsOf(FULL)[0]).toEqual({
      sheetRow: 2,
      problems: [],
      row: {
        nationalId: '1098765432',
        fullName: 'María Pérez',
        occupation: 'Tendera',
        phone: '3001234567',
        address: 'Calle 1',
        loan: { remainingInstallments: 10, installmentValue: 30000, frequency: 'WEEKLY', nextInstallmentDate: '2026-11-03', pendingCapital: 300000, collectorPhone: '3009876543' },
      },
    });
  });

  it('sends a client alone when the loan columns are empty', () => {
    const [row] = rowsOf(['1', 'Ana', '', '3001112222', '', null, null, null, null, null, null]);

    expect(row?.row?.loan).toBeNull();
  });

  it('accepts Excel dates, ISO dates and optional columns left out', () => {
    const [a, b] = rowsOf(
      ['1', 'Ana', '', '3001112222', '', 5, 1000, 'diaria', new Date(Date.UTC(2026, 10, 3)), null, null],
      ['2', 'Luis', '', '3001112223', '', '5', '1000', 'Mensual', '2026-11-3', '', ''],
    );

    expect(a?.row?.loan).toEqual({ remainingInstallments: 5, installmentValue: 1000, frequency: 'DAILY', nextInstallmentDate: '2026-11-03' });
    expect(b?.row?.loan?.frequency).toBe('MONTHLY');
    expect(b?.row?.loan?.nextInstallmentDate).toBe('2026-11-03');
  });

  it('recognises headers without accents or capitals, in any order', () => {
    const parsed = parseSheet([['CELULAR', 'nombre', 'CEDULA'], ['3001112222', 'Ana', '1']]);

    expect(parsed.kind === 'ok' && parsed.rows[0]?.row).toMatchObject({ nationalId: '1', fullName: 'Ana', phone: '3001112222', loan: null });
  });

  it('keeps a row with a half-written loan out and says what is wrong', () => {
    const [row] = rowsOf(['1', 'Ana', '', '3001112222', '', null, 1000, 'cada rato', 'mañana', null, null]);

    expect(row?.row).toBeNull();
    expect(row?.problems).toHaveLength(3);
  });

  it('reports missing required columns, empty sheets and too many rows', () => {
    expect(parseSheet([['Nombre']])).toEqual({ kind: 'missing-columns', missing: ['Cédula', 'Celular'] });
    expect(parseSheet([])).toEqual({ kind: 'empty' });
    expect(parseSheet([HEADER, ['', '', '', '']])).toEqual({ kind: 'empty' });
    expect(parseSheet([HEADER, ...Array.from({ length: MAX_SHEET_ROWS + 1 }, () => FULL)])).toEqual({ kind: 'too-many' });
  });

  it('skips blank rows in the middle but keeps the sheet row numbers', () => {
    const rows = rowsOf(FULL, [], FULL);

    expect(rows.map((row) => row.sheetRow)).toEqual([2, 4]);
  });
});

describe('parseCsv', () => {
  it('splits on commas, honours quotes and a BOM', () => {
    expect(parseCsv('﻿a,"b,1","c ""x"""\r\n\r\n1,2,3\n')).toEqual([['a', 'b,1', 'c "x"'], ['1', '2', '3']]);
  });

  it('uses semicolons when the header has them (Excel in Spanish)', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('the template reads back as a valid sheet', () => {
    const parsed = parseSheet(parseCsv(templateCsv()));

    expect(parsed.kind === 'ok' && parsed.rows[0]?.problems).toEqual([]);
  });
});
