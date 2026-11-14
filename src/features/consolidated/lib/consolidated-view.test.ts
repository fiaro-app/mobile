import type { Consolidated } from '@/features/consolidated/lib/consolidated-schemas';
import { buildConsolidatedModel } from '@/features/consolidated/lib/consolidated-view';

const FIGURES = { totalPortfolio: 1_000_000, portfolioAtRisk: 100_000, arrearsRate: 0.1, expectedAmount: 200_000, collectedAmount: 150_000, effectiveness: 0.75 };
const DATA: Consolidated = {
  from: '2026-11-01',
  to: '2026-11-14',
  lenders: [
    { lenderId: 'a', name: 'Negocio A', ...FIGURES },
    { lenderId: 'b', name: 'Negocio B', ...FIGURES, arrearsRate: null, effectiveness: null },
  ],
  totals: { ...FIGURES, totalPortfolio: 2_000_000 },
};

describe('buildConsolidatedModel', () => {
  it('da una fila por negocio y una última con el total', () => {
    const model = buildConsolidatedModel(DATA);

    expect(model?.rows.map((row) => row.name)).toEqual(['Negocio A', 'Negocio B', 'Total']);
    expect(model?.rows[0]?.lines).toEqual(['Cartera $1.000.000 · En riesgo $100.000', 'Mora 10 % · Cobrado $150.000 · Efectividad 75 %']);
    expect(model?.rows[1]?.lines[1]).toContain('Mora — ');
    expect(model?.rows[2]?.lines[0]).toContain('$2.000.000');
  });

  it('con un solo negocio no hay nada que mostrar', () => {
    expect(buildConsolidatedModel({ ...DATA, lenders: [DATA.lenders[0]!] })).toBeNull();
  });
});
