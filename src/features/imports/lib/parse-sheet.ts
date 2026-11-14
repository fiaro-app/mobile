import type { ImportFrequency, ImportRow } from '@/features/imports/lib/import-schemas';

/** Cuántas filas se leen como máximo de una hoja (10 tandas de 200). */
export const MAX_SHEET_ROWS = 2000;

/** Una celda de la hoja: texto, número, fecha o vacía. */
export type Cell = string | number | boolean | Date | null | undefined;

/** Una fila ya leída: lo que se manda a la API, o por qué no se puede mandar. */
export interface ParsedRow {
  /** Número de fila en la hoja (la primera de datos es la 2). */
  readonly sheetRow: number;
  readonly row: ImportRow | null;
  readonly problems: readonly string[];
}

export type ParsedSheet =
  | { readonly kind: 'ok'; readonly rows: readonly ParsedRow[] }
  | { readonly kind: 'missing-columns'; readonly missing: readonly string[] }
  | { readonly kind: 'empty' }
  | { readonly kind: 'too-many' };

/** Las columnas de la plantilla, en orden, con los nombres que se aceptan para cada una (los mismos de la web). */
export const COLUMNS = {
  nationalId: { title: 'Cédula', aliases: ['cedula', 'documento', 'identificacion'] },
  fullName: { title: 'Nombre', aliases: ['nombre completo', 'cliente'] },
  occupation: { title: 'Ocupación', aliases: ['ocupacion', 'oficio'] },
  phone: { title: 'Celular', aliases: ['telefono', 'celular del cliente'] },
  address: { title: 'Dirección', aliases: ['direccion'] },
  remaining: { title: 'Cuotas que faltan', aliases: ['cuotas pendientes', 'cuotas restantes'] },
  value: { title: 'Valor de la cuota', aliases: ['valor cuota', 'cuota'] },
  frequency: { title: 'Frecuencia', aliases: ['periodicidad'] },
  nextDate: { title: 'Próxima cuota', aliases: ['proxima cuota', 'fecha proxima cuota', 'fecha de la proxima cuota'] },
  capital: { title: 'Capital pendiente', aliases: ['capital que falta', 'saldo capital'] },
  collector: { title: 'Celular del cobrador', aliases: ['cobrador', 'telefono del cobrador'] },
} as const;
type ColumnKey = keyof typeof COLUMNS;

const REQUIRED: readonly ColumnKey[] = ['nationalId', 'fullName', 'phone'];

const FREQUENCIES: Readonly<Record<string, ImportFrequency>> = {
  diaria: 'DAILY',
  diario: 'DAILY',
  semanal: 'WEEKLY',
  quincenal: 'BIWEEKLY',
  mensual: 'MONTHLY',
};

/** Máximo de dígitos de un monto: lo mantiene dentro de `Number.MAX_SAFE_INTEGER`. */
const MAX_AMOUNT_DIGITS = 15;

/** Minúsculas y sin tildes ni espacios sobrantes, para comparar encabezados. */
const normalize = (value: string) => value.normalize('NFD').replaceAll(/[̀-ͯ]/g, '').trim().toLowerCase().replaceAll(/\s+/g, ' ');

const asText = (cell: Cell): string => {
  if (cell === null || cell === undefined || cell instanceof Date) return '';
  return String(cell).trim();
};

const pad = (n: number) => String(n).padStart(2, '0');

/** `AAAA-MM-DD` desde una fecha de Excel, `dd/mm/aaaa` o `aaaa-mm-dd`; `null` si no se entiende. */
function toIsoDate(cell: Cell): string | null {
  if (cell instanceof Date) return `${String(cell.getUTCFullYear())}-${pad(cell.getUTCMonth() + 1)}-${pad(cell.getUTCDate())}`;
  const text = asText(cell);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  return local ? `${local[3]}-${pad(Number(local[2]))}-${pad(Number(local[1]))}` : null;
}

/** Un entero de pesos o de cuotas desde un número o un texto como `$ 1.250.000`; `null` si no hay dígitos. */
function toNumber(cell: Cell): number | null {
  if (typeof cell === 'number') return Math.round(cell);
  const digits = asText(cell).replaceAll(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS);
  return digits === '' ? null : Number(digits);
}

/** Dónde está cada columna de la hoja. */
function locateColumns(header: readonly Cell[]): Partial<Record<ColumnKey, number>> {
  const names = header.map((cell) => normalize(asText(cell)));
  const found: Partial<Record<ColumnKey, number>> = {};
  for (const key of Object.keys(COLUMNS) as ColumnKey[]) {
    const accepted = new Set([COLUMNS[key].title, ...COLUMNS[key].aliases].map(normalize));
    const index = names.findIndex((name) => accepted.has(name));
    if (index >= 0) found[key] = index;
  }
  return found;
}

const isBlank = (cell: Cell) => asText(cell) === '' && !(cell instanceof Date);

/** Lee el préstamo de una fila; `null` si las columnas del préstamo están vacías o mal escritas (en ese caso anota los problemas). */
function readLoan(get: (key: ColumnKey) => Cell, problems: string[]): ImportRow['loan'] {
  const loanKeys: readonly ColumnKey[] = ['remaining', 'value', 'frequency', 'nextDate'];
  if (loanKeys.every((key) => isBlank(get(key)))) return null;
  const remaining = toNumber(get('remaining'));
  const value = toNumber(get('value'));
  const frequency = FREQUENCIES[normalize(asText(get('frequency')))];
  const nextDate = toIsoDate(get('nextDate'));
  if (remaining === null) problems.push('Falta «Cuotas que faltan».');
  if (value === null) problems.push('Falta «Valor de la cuota».');
  if (frequency === undefined) problems.push('«Frecuencia» debe ser Diaria, Semanal, Quincenal o Mensual.');
  if (nextDate === null) problems.push('«Próxima cuota» debe ser una fecha (dd/mm/aaaa).');
  if (remaining === null || value === null || frequency === undefined || nextDate === null) return null;
  const capital = toNumber(get('capital'));
  const collector = asText(get('collector'));
  return {
    remainingInstallments: remaining,
    installmentValue: value,
    frequency,
    nextInstallmentDate: nextDate,
    ...(capital === null ? {} : { pendingCapital: capital }),
    ...(collector === '' ? {} : { collectorPhone: collector }),
  };
}

/**
 * Convierte las celdas de una hoja (primera fila = encabezados) en las filas que se mandan a la API.
 * Los encabezados se reconocen sin importar tildes ni mayúsculas. Una fila cuyo préstamo está a medias
 * o mal escrito no se manda y queda con sus problemas; el resto de revisiones (cédula, celular, tope
 * del plan) las hace la API.
 *
 * @param cells - Las filas de la hoja, encabezados incluidos.
 */
export function parseSheet(cells: readonly (readonly Cell[])[]): ParsedSheet {
  const [header, ...body] = cells;
  if (!header) return { kind: 'empty' };
  const columns = locateColumns(header);
  const missing = REQUIRED.filter((key) => columns[key] === undefined).map((key) => COLUMNS[key].title);
  if (missing.length > 0) return { kind: 'missing-columns', missing };
  const data = body.map((row, index) => ({ row, sheetRow: index + 2 })).filter(({ row }) => row.some((cell) => !isBlank(cell)));
  if (data.length === 0) return { kind: 'empty' };
  if (data.length > MAX_SHEET_ROWS) return { kind: 'too-many' };

  const rows = data.map(({ row, sheetRow }): ParsedRow => {
    const get = (key: ColumnKey): Cell => {
      const column = columns[key];
      return column === undefined ? null : row[column];
    };
    const problems: string[] = [];
    const loan = readLoan(get, problems);
    if (problems.length > 0) return { sheetRow, row: null, problems };
    return {
      sheetRow,
      problems,
      row: {
        nationalId: asText(get('nationalId')),
        fullName: asText(get('fullName')),
        occupation: asText(get('occupation')),
        phone: asText(get('phone')),
        address: asText(get('address')),
        loan,
      },
    };
  });
  return { kind: 'ok', rows };
}

/** La plantilla `.csv`: los encabezados y una fila de ejemplo. Lleva BOM para que Excel respete las tildes. */
export function templateCsv(): string {
  const header = Object.values(COLUMNS).map((column) => column.title);
  const example = ['1098765432', 'María Pérez', 'Tendera', '3001234567', 'Calle 1 # 2-3', '10', '30000', 'Semanal', '03/11/2026', '300000', '3009876543'];
  return `﻿${header.join(',')}\n${example.join(',')}\n`;
}
