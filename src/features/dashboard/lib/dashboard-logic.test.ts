import { DashboardSchema } from '@/features/dashboard/lib/dashboard-schemas';
import { buildDashboardModel, effectivenessTone, UNKNOWN_COLLECTOR } from '@/features/dashboard/lib/dashboard-view-model';

const settlement = (id: string, collector: string, expected: number, collected: number) => ({
  id, date: '2026-10-09', status: 'PENDING' as const, collectorMembershipId: collector, expectedAmount: expected, collectedAmount: collected,
  collectedByMethod: { CASH: collected, NEQUI: 0, TRANSFER: 0 }, collectorNote: null,
});
const dashboard = {
  totalPortfolio: 18400000, collectedToday: 3200000, activeCollectors: 7, totalCollectors: 9, effectivenessToday: 0.84, clientsInArrears: 23,
  alerts: ['3 cobradores aún no han iniciado su ruta hoy.'],
  pendingSettlements: [settlement('s1', 'm1', 450000, 420000), settlement('s2', 'm9', 100000, 100000), settlement('s3', 'm1', 100000, 120000)],
};

describe('resumen', () => {
  it('clasifica la efectividad', () => {
    expect(effectivenessTone(0.95)).toBe('good');
    expect(effectivenessTone(0.9)).toBe('good');
    expect(effectivenessTone(0.75)).toBe('warning');
    expect(effectivenessTone(0.5)).toBe('bad');
    expect(effectivenessTone(null)).toBe('neutral');
  });

  it('arma los indicadores', () => {
    const model = buildDashboardModel(dashboard, new Map());
    expect(model.kpis.map((kpi) => [kpi.key, kpi.value, kpi.tone])).toEqual([
      ['portfolio', '$18.4M', 'neutral'],
      ['collected', '$3.2M', 'good'],
      ['collectors', '7 / 9', 'neutral'],
      ['effectiveness', '84 %', 'warning'],
      ['arrears', '23', 'bad'],
    ]);
    expect(model.alerts).toHaveLength(1);
    expect(buildDashboardModel({ ...dashboard, clientsInArrears: 0 }, new Map()).kpis[4]?.tone).toBe('neutral');
  });

  it('con un período muestra lo cobrado y la efectividad de ese período', () => {
    const model = buildDashboardModel({ ...dashboard, collectedInPeriod: 9_000_000, effectivenessInPeriod: 0.5 }, new Map(), true);
    expect(model.kpis[1]).toMatchObject({ label: 'Cobrado en el período', value: '$9M' });
    expect(model.kpis[3]).toMatchObject({ label: 'Efectividad del período', value: '50 %' });
    expect(buildDashboardModel(dashboard, new Map(), true).kpis[3]?.value).toBe(buildDashboardModel({ ...dashboard, effectivenessToday: null }, new Map()).kpis[3]?.value);
  });

  it('describe cada cuadre con nombre y diferencia', () => {
    const model = buildDashboardModel(dashboard, new Map([['m1', 'Alejo Zuleta']]));
    expect(model.pending).toEqual([
      { id: 's1', collectorName: 'Alejo Zuleta', expected: 'Cuadre: $450.000', difference: '-$30.000', differenceTone: 'bad' },
      { id: 's2', collectorName: UNKNOWN_COLLECTOR, expected: 'Cuadre: $100.000', difference: 'Cuadra', differenceTone: 'good' },
      { id: 's3', collectorName: 'Alejo Zuleta', expected: 'Cuadre: $100.000', difference: '$20.000', differenceTone: 'warning' },
    ]);
  });

  it('valida la respuesta del API', () => {
    expect(DashboardSchema.parse(dashboard).activeCollectors).toBe(7);
    expect(() => DashboardSchema.parse({ ...dashboard, totalPortfolio: 'x' })).toThrow();
  });
});
