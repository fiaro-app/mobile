import { toRiskCardProps, toRiskView } from '@/features/risk/lib/risk-view';

const BASE = { clientId: 'c', loansCount: 2, score: 80, level: 'VERY_HIGH' as const };

describe('toRiskView', () => {
  it('traduce nivel, color y una frase por factor', () => {
    const view = toRiskView({
      ...BASE,
      factors: [
        { code: 'OVERDUE_DAYS', points: 70, value: 40 },
        { code: 'OVERDUE_SHARE', points: 10, value: 60 },
        { code: 'MULTIPLE_LOANS_IN_ARREARS', points: 10, value: 2 },
        { code: 'PAID_LOANS', points: -5, value: 1 },
      ],
    });

    expect(view).toMatchObject({ levelLabel: 'muy alto', tone: 'destructive', ariaLabel: 'Riesgo muy alto: 80 de 100', hasHistory: true });
    expect(view.factors).toEqual([
      'Tiene un préstamo con 40 días de atraso.',
      'El 60 % de su saldo está vencido.',
      'Tiene 2 préstamos en mora a la vez.',
      'Ya pagó 1 préstamo (resta riesgo).',
    ]);
  });

  it('pluraliza los préstamos pagados y marca sin historial a quien no tiene préstamos', () => {
    const view = toRiskView({ ...BASE, loansCount: 0, level: 'LOW', score: 0, factors: [{ code: 'PAID_LOANS', points: -10, value: 2 }] });

    expect(view.hasHistory).toBe(false);
    expect(view.tone).toBe('success');
    expect(view.factors[0]).toBe('Ya pagó 2 préstamos (resta riesgo).');
  });
});

describe('toRiskCardProps', () => {
  it('arma la tarjeta con el medidor y avisa cuando no hay historial', () => {
    const view = toRiskView({ clientId: 'c1', score: 40, level: 'MEDIUM', loansCount: 0, factors: [] });
    const card = toRiskCardProps(view);

    expect(card.gauge).toEqual({ score: 40, tone: 'primary', label: view.ariaLabel });
    expect(card.noHistory).toEqual(expect.any(String));
    expect(toRiskCardProps({ ...view, hasHistory: true }).noHistory).toBeNull();
  });
});
