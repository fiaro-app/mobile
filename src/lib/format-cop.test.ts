import { formatCop } from '@/lib/format-cop';

describe('formatCop', () => {
  it('formats an integer COP amount with thousands separators', () => {
    expect(formatCop(1234567)).toBe('$1.234.567');
  });

  it('rounds non-integer amounts', () => {
    expect(formatCop(1000.6)).toBe('$1.001');
  });
});
