import { formatCop, formatCopCompact, formatPercent } from '@/lib/format-cop';

describe('formatCop', () => {
  it('formats an integer COP amount with thousands separators', () => {
    expect(formatCop(1234567)).toBe('$1.234.567');
  });

  it('rounds non-integer amounts', () => {
    expect(formatCop(1000.6)).toBe('$1.001');
  });
});

describe('formatCop negativos y compacto', () => {
  it('pone el signo antes del $', () => {
    expect(formatCop(-30000)).toBe('-$30.000');
  });

  it('abrevia millones', () => {
    expect(formatCopCompact(18400000)).toBe('$18.4M');
    expect(formatCopCompact(950000)).toBe('$950.000');
    expect(formatCopCompact(-3200000)).toBe('-$3.2M');
    expect(formatCopCompact(1234000000)).toBe('$1.234M');
  });

  it('formatea porcentajes', () => {
    expect(formatPercent(0.84)).toBe('84 %');
    expect(formatPercent(null)).toBe('—');
  });
});
