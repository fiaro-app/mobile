import { DATE_RANGE_LIMITS, EMPTY_RANGE, pickRangeDate } from '@/lib/date-range';

const visits = DATE_RANGE_LIMITS.visits;

describe('pickRangeDate', () => {
  it('con un solo extremo es ese día', () => {
    expect(pickRangeDate(EMPTY_RANGE, 'from', '2026-10-01', visits)).toEqual({ from: '2026-10-01', to: '2026-10-01' });
    expect(pickRangeDate(EMPTY_RANGE, 'to', '2026-10-05', visits)).toEqual({ from: '2026-10-05', to: '2026-10-05' });
  });

  it('nunca deja «hasta» antes de «desde»', () => {
    expect(pickRangeDate({ from: '2026-10-01', to: '2026-10-05' }, 'from', '2026-10-09', visits)).toEqual({ from: '2026-10-09', to: '2026-10-09' });
    expect(pickRangeDate({ from: '2026-10-05', to: '2026-10-09' }, 'to', '2026-10-01', visits)).toEqual({ from: '2026-10-01', to: '2026-10-01' });
  });

  it('respeta el tope moviendo el otro extremo', () => {
    expect(pickRangeDate({ from: '2026-10-01', to: '2026-10-10' }, 'from', '2026-01-01', visits)).toEqual({ from: '2026-01-01', to: '2026-04-03' });
    expect(pickRangeDate({ from: '2026-01-01', to: '2026-01-10' }, 'to', '2026-10-10', visits)).toEqual({ from: '2026-07-10', to: '2026-10-10' });
  });

  it('deja un rango válido tal cual', () => {
    expect(pickRangeDate({ from: '2026-10-01', to: '2026-10-10' }, 'to', '2026-10-12', DATE_RANGE_LIMITS.history)).toEqual({ from: '2026-10-01', to: '2026-10-12' });
  });
});
