import { filterEntries, hasActiveFilters, NO_FILTERS, normalizeText } from '@/features/route/lib/client-filter';
import { classifyEntry, LATE_MAX_DAYS, overdueDaysLabel } from '@/features/route/lib/entry-status';
import { RouteSchema, type RouteEntry } from '@/features/route/lib/route-entry';
import { resolveRouteView } from '@/features/route/lib/route-view';

const entry = (over: Partial<RouteEntry>): RouteEntry => ({
  loanId: 'l', clientId: 'c', clientFullName: 'Marta Gómez', balance: 420000, overdueAmount: 0, overdueDays: 0, nextDueDate: null, ...over,
});

const MORA = entry({ clientFullName: 'Marta Gómez', overdueAmount: 90000, overdueDays: 12 });
const AL_DIA = entry({ clientFullName: 'Carlos Restrepo', balance: 180000 });
const ATRASO = entry({ clientFullName: 'Yolanda Pérez', balance: 95000, overdueAmount: 15000, overdueDays: 3 });
const PAGADO = entry({ clientFullName: 'Diego Herrera', balance: 0 });
const ALL = [MORA, AL_DIA, ATRASO, PAGADO];

describe('classifyEntry', () => {
  it.each([
    [MORA, 'overdue'],
    [AL_DIA, 'on-time'],
    [ATRASO, 'late'],
    [PAGADO, 'paid'],
    [entry({ overdueAmount: 1, overdueDays: LATE_MAX_DAYS }), 'late'],
    [entry({ overdueAmount: 1, overdueDays: LATE_MAX_DAYS + 1 }), 'overdue'],
    [entry({ balance: 0, overdueAmount: 5000, overdueDays: 20 }), 'paid'],
    [entry({ overdueAmount: 50000, overdueDays: 0 }), 'on-time'],
  ])('%j -> %s', (row, expected) => {
    expect(classifyEntry(row)).toBe(expected);
  });

  it('formatea los días en singular y plural', () => {
    expect([0, 1, 12].map(overdueDaysLabel)).toEqual(['0 días', '1 día', '12 días']);
  });
});

describe('filterEntries', () => {
  const names = (rows: RouteEntry[]) => rows.map((row) => row.clientFullName);

  it('sin filtros devuelve todo', () => {
    expect(filterEntries(ALL, NO_FILTERS)).toHaveLength(4);
  });

  it('busca sin importar tildes ni mayúsculas', () => {
    expect(names(filterEntries(ALL, { ...NO_FILTERS, search: ' PEREZ ' }))).toEqual(['Yolanda Pérez']);
    expect(normalizeText('Gómez')).toBe('gomez');
  });

  it('filtra por estado', () => {
    expect(names(filterEntries(ALL, { ...NO_FILTERS, status: 'overdue' }))).toEqual(['Marta Gómez']);
    expect(names(filterEntries(ALL, { ...NO_FILTERS, status: 'late' }))).toEqual(['Yolanda Pérez']);
    expect(names(filterEntries(ALL, { ...NO_FILTERS, status: 'on-time' }))).toEqual(['Carlos Restrepo']);
  });

  it.each([
    ['0-7', ['Carlos Restrepo', 'Yolanda Pérez', 'Diego Herrera']],
    ['8-15', ['Marta Gómez']],
    ['16-30', []],
    ['30+', []],
  ] as const)('filtra por el rango %s', (range, expected) => {
    expect(names(filterEntries(ALL, { ...NO_FILTERS, range }))).toEqual(expected);
  });

  it('el rango 30+ incluye desde 31 días', () => {
    expect(filterEntries([entry({ overdueDays: 31 }), entry({ overdueDays: 30 })], { ...NO_FILTERS, range: '30+' })).toHaveLength(1);
  });

  it('combina los criterios con "y"', () => {
    expect(filterEntries(ALL, { search: 'a', status: 'late', range: '0-7' })).toHaveLength(1);
    expect(filterEntries(ALL, { search: 'marta', status: 'late', range: 'any' })).toHaveLength(0);
  });

  it('detecta si hay filtros activos', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, search: '  ' })).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, range: '8-15' })).toBe(true);
  });
});

describe('RouteSchema', () => {
  it('acepta la forma del API y rechaza lo demás', () => {
    expect(RouteSchema.safeParse([MORA]).success).toBe(true);
    expect(RouteSchema.safeParse([{ ...MORA, balance: 'x' }]).success).toBe(false);
  });
});

describe('resolveRouteView', () => {
  const http = (status: number) => ({ kind: 'http', status, code: null, retryAfterSeconds: null }) as const;

  it('carga, listo y vacío', () => {
    expect(resolveRouteView(undefined, null)).toBe('loading');
    expect(resolveRouteView(ALL, null)).toBe('ready');
    expect(resolveRouteView([], null)).toBe('empty');
  });

  it('clasifica los fallos sin datos previos', () => {
    expect(resolveRouteView(undefined, { kind: 'offline' })).toBe('offline');
    expect(resolveRouteView(undefined, { kind: 'maintenance' })).toBe('maintenance');
    expect(resolveRouteView(undefined, http(403))).toBe('forbidden');
    expect(resolveRouteView(undefined, http(500))).toBe('error');
  });

  it('conserva la lista anterior si un refresco falla', () => {
    expect(resolveRouteView(ALL, { kind: 'offline' })).toBe('ready');
    expect(resolveRouteView([], { kind: 'offline' })).toBe('empty');
  });
});
