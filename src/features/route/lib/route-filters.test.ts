import type { RouteEntry } from '@/features/route/lib/route-entry';
import { applyRouteView, countByFilter } from '@/features/route/lib/route-filters';

const entry = (name: string, over: Partial<RouteEntry>): RouteEntry => ({
  loanId: name,
  clientId: name,
  clientFullName: name,
  balance: 100000,
  overdueAmount: 0,
  overdueDays: 0,
  nextDueDate: null,
  collectedToday: 0,
  ...over,
});

const MORA = entry('Mora', { overdueDays: 12, overdueAmount: 90000, balance: 300000 });
const ATRASO = entry('Atraso', { overdueDays: 3, overdueAmount: 30000, balance: 500000 });
const AL_DIA = entry('Al día', {});
const COBRADO = entry('Cobrado', { overdueDays: 20, collectedToday: 20000, balance: 800000 });
const ALL = [MORA, ATRASO, AL_DIA, COBRADO];
const names = (rows: readonly RouteEntry[]) => rows.map((row) => row.clientFullName);

describe('countByFilter', () => {
  it('cuenta cada pastilla; quien ya pagó solo cuenta en Cobrados, no en Mora', () => {
    expect(countByFilter(ALL)).toEqual({ all: 4, pending: 3, delinquent: 1, late: 1, current: 1, collected: 1 });
  });
});

describe('applyRouteView', () => {
  it('filtra por estado y por lo que falta cobrar', () => {
    expect(names(applyRouteView(ALL, 'delinquent', 'urgent'))).toEqual(['Mora']);
    expect(names(applyRouteView(ALL, 'late', 'urgent'))).toEqual(['Atraso']);
    expect(names(applyRouteView(ALL, 'current', 'urgent'))).toEqual(['Al día']);
    expect(names(applyRouteView(ALL, 'pending', 'urgent'))).toEqual(['Mora', 'Atraso', 'Al día']);
    expect(names(applyRouteView(ALL, 'collected', 'urgent'))).toEqual(['Cobrado']);
  });

  it('el orden urgente respeta el del API', () => {
    expect(names(applyRouteView(ALL, 'all', 'urgent'))).toEqual(['Mora', 'Atraso', 'Al día', 'Cobrado']);
  });

  it('ordena por deuda, por días de mora o por nombre, siempre con quien ya pagó al final', () => {
    expect(names(applyRouteView(ALL, 'all', 'balance'))).toEqual(['Atraso', 'Mora', 'Al día', 'Cobrado']);
    expect(names(applyRouteView(ALL, 'all', 'days'))).toEqual(['Mora', 'Atraso', 'Al día', 'Cobrado']);
    expect(names(applyRouteView(ALL, 'all', 'name'))).toEqual(['Al día', 'Atraso', 'Mora', 'Cobrado']);
  });

  it('no modifica la lista original', () => {
    applyRouteView(ALL, 'all', 'name');
    expect(names(ALL)).toEqual(['Mora', 'Atraso', 'Al día', 'Cobrado']);
  });
});
