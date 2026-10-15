import { buildInsightsModel } from '@/features/insights/lib/insights-view';
import { InsightsSchema, type Insights } from '@/features/insights/lib/insights-schemas';

const DATA: Insights = {
  from: '2026-10-01',
  to: '2026-10-03',
  daily: [
    { date: '2026-10-01', expected: 100000, collected: 60000 },
    { date: '2026-10-02', expected: 100000, collected: 0 },
    { date: '2026-10-03', expected: 0, collected: 20000 },
  ],
  income: { collected: 80000, byMethod: { CASH: 60000, NEQUI: 20000, TRANSFER: 0 }, interest: 20000, principalRecovered: 60000, interestShare: 0.25 },
  origination: { loansCreated: 2, amountLent: 500000, averageTicket: 250000, agreedInterest: 100000 },
  visits: { PAID: 6, NOT_FOUND: 2, REFUSED: 1, RESCHEDULED: 1, total: 10, contactRate: 0.8, paidRate: 0.6 },
  settlements: { submitted: 3, balanced: 1, withDifference: 2, shortfall: 40000, surplus: 5000 },
  forecast: Array.from({ length: 7 }, (_, index) => ({ date: `2026-10-${String(4 + index).padStart(2, '0')}`, expected: index === 0 ? 70000 : 0 })),
  previous: { from: '2026-09-28', to: '2026-09-30', collected: 40000, interest: 10000, loansCreated: 1, amountLent: 200000 },
};

const EMPTY: Insights = {
  ...DATA,
  income: { collected: 0, byMethod: { CASH: 0, NEQUI: 0, TRANSFER: 0 }, interest: 0, principalRecovered: 0, interestShare: null },
  origination: { loansCreated: 0, amountLent: 0, averageTicket: null, agreedInterest: 0 },
  visits: { PAID: 0, NOT_FOUND: 0, REFUSED: 0, RESCHEDULED: 0, total: 0, contactRate: null, paidRate: null },
  settlements: { submitted: 0, balanced: 0, withDifference: 0, shortfall: 0, surplus: 0 },
};

const card = (model: ReturnType<typeof buildInsightsModel>, id: string) => model.cards.find((entry) => entry.id === id);

describe('buildInsightsModel', () => {
  it('arma los indicadores con tendencia frente al período anterior', () => {
    const model = buildInsightsModel(DATA);

    expect(model.kpis.map((kpi) => kpi.key)).toEqual(['collected', 'interest', 'lent', 'contact']);
    expect(model.kpis[0]).toMatchObject({ value: '$80.000', trend: { label: '↑ 100 %' } });
    expect(model.kpis[1]?.trend?.tone).toBe('good');
    expect(model.kpis[3]?.value).toBe('80 %');
  });

  it('la gráfica diaria resume el período y rotula cada día con su fecha corta', () => {
    const daily = card(buildInsightsModel(DATA), 'daily');

    expect(daily).toMatchObject({ kind: 'bars', note: 'En el período cobraste $80.000 de $200.000 que vencían según el calendario.' });
    expect(daily?.kind === 'bars' && daily.bars.map((bar) => bar.label)).toEqual(['01/10', '02/10', '03/10']);
  });

  it('parte lo cobrado en capital e interés y por medio de pago', () => {
    const model = buildInsightsModel(DATA);
    const income = card(model, 'income');
    const methods = card(model, 'methods');

    expect(income?.kind === 'proportion' && income.segments.map((segment) => [segment.id, segment.value])).toEqual([['principal', 60000], ['interest', 20000]]);
    expect(methods?.kind === 'proportion' && methods.segments.map((segment) => segment.id)).toEqual(['CASH', 'NEQUI', 'TRANSFER']);
  });

  it('explica colocación, visitas, cuadres y proyección', () => {
    const model = buildInsightsModel(DATA);

    expect(card(model, 'lending')).toMatchObject({ kind: 'lines', lines: ['2 préstamos nuevos', 'Promedio por préstamo: $250.000', 'Interés pactado: $100.000'] });
    expect(card(model, 'visits')).toMatchObject({ kind: 'proportion', note: '10 visitas · encontraron al cliente en 80 % y terminaron en pago en 60 %.' });
    expect(card(model, 'settlements')).toMatchObject({ lines: ['3 cuadres enviados', '1 cuadraron exacto', '2 con diferencia: faltaron $40.000 y sobraron $5.000'] });
    const forecast = card(model, 'forecast');
    expect(forecast).toMatchObject({ kind: 'bars', note: 'Total esperado: $70.000', showCollected: false });
    expect(forecast?.kind === 'bars' && forecast.bars).toHaveLength(7);
  });

  it('sin movimiento, cada tarjeta lo dice en vez de mostrar ceros', () => {
    const model = buildInsightsModel(EMPTY);

    for (const id of ['income', 'methods', 'lending', 'visits', 'settlements']) {
      expect(card(model, id)?.kind).toBe('empty');
    }
    expect(model.kpis[3]?.value).toBe('—');
  });

  it('con un préstamo usa el singular, sin ticket no lo menciona y sin diferencias no habla de faltantes', () => {
    const model = buildInsightsModel({
      ...DATA,
      origination: { loansCreated: 1, amountLent: 100000, averageTicket: null, agreedInterest: 0 },
      settlements: { submitted: 1, balanced: 1, withDifference: 0, shortfall: 0, surplus: 0 },
    });

    expect(card(model, 'lending')).toMatchObject({ lines: ['1 préstamo nuevo', 'Interés pactado: $0'] });
    expect(card(model, 'settlements')).toMatchObject({ lines: ['1 cuadre enviado', '1 cuadraron exacto'] });
  });
});

describe('InsightsSchema', () => {
  it('lee la respuesta del API y rechaza una incompleta', () => {
    expect(InsightsSchema.parse(DATA).daily).toHaveLength(3);
    expect(() => InsightsSchema.parse({ from: '2026-10-01' })).toThrow();
  });
});
