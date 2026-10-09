import { currentRange, previousRange } from '@/features/stats/lib/period-range';
import { PeriodStatsSchema } from '@/features/stats/lib/stats-schemas';
import { buildStatsModel, compareCollected, effectivenessLabel } from '@/features/stats/lib/stats-view-model';

describe('rangos de período', () => {
  it('la semana empieza el lunes', () => {
    expect(currentRange('week', '2026-10-09')).toEqual({ from: '2026-10-05', to: '2026-10-09' });
    expect(currentRange('week', '2026-10-11')).toEqual({ from: '2026-10-05', to: '2026-10-11' });
    expect(currentRange('week', '2026-10-05')).toEqual({ from: '2026-10-05', to: '2026-10-05' });
  });

  it('mes y año van desde el primer día hasta hoy', () => {
    expect(currentRange('month', '2026-10-09')).toEqual({ from: '2026-10-01', to: '2026-10-09' });
    expect(currentRange('year', '2026-10-09')).toEqual({ from: '2026-01-01', to: '2026-10-09' });
  });

  it('el período anterior dura lo mismo que lo transcurrido', () => {
    expect(previousRange('week', '2026-10-09')).toEqual({ from: '2026-09-28', to: '2026-10-02' });
    expect(previousRange('month', '2026-10-09')).toEqual({ from: '2026-09-01', to: '2026-09-09' });
    expect(previousRange('year', '2026-10-09')).toEqual({ from: '2025-01-01', to: '2025-10-09' });
  });

  it('recorta el día cuando el mes anterior es más corto', () => {
    expect(previousRange('month', '2026-03-31')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(previousRange('month', '2026-01-15')).toEqual({ from: '2025-12-01', to: '2025-12-15' });
    expect(previousRange('year', '2028-02-29')).toEqual({ from: '2027-01-01', to: '2027-02-28' });
  });
});

describe('cifras', () => {
  const stats = { from: '2026-10-01', to: '2026-10-09', expectedAmount: 1000000, collectedAmount: 900000, effectiveness: 0.9, visitsCount: 42, overdueAmount: 250000 };

  it('formatea la efectividad', () => {
    expect(effectivenessLabel(0.9)).toBe('90 %');
    expect(effectivenessLabel(0.876)).toBe('88 %');
    expect(effectivenessLabel(null)).toBe('—');
  });

  it('compara con el período anterior', () => {
    expect(compareCollected(120, 100)).toEqual({ text: '+20 % frente al período anterior', direction: 'up' });
    expect(compareCollected(80, 100)).toEqual({ text: '-20 % frente al período anterior', direction: 'down' });
    expect(compareCollected(100, 100).direction).toBe('same');
    expect(compareCollected(100, 0).direction).toBe('none');
    expect(compareCollected(100, undefined).direction).toBe('none');
  });

  it('arma el modelo con textos', () => {
    expect(buildStatsModel(stats, { ...stats, collectedAmount: 600000 })).toMatchObject({
      collected: '$900.000', expected: '$1.000.000', effectiveness: '90 %', visits: '42', overdue: '$250.000',
      comparison: { direction: 'up' },
    });
  });

  it('valida la respuesta del API', () => {
    expect(PeriodStatsSchema.parse(stats).visitsCount).toBe(42);
    expect(PeriodStatsSchema.parse({ ...stats, effectiveness: null }).effectiveness).toBeNull();
    expect(() => PeriodStatsSchema.parse({ ...stats, visitsCount: -1 })).toThrow();
  });
});
