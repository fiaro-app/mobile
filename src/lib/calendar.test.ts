import { addDays, addMonths, dayLabel, daysInRange, formatDisplayDate, monthGrid, monthLabel, parseIsoDate, startOfMonth } from '@/lib/calendar';

describe('calendar', () => {
  it('reconoce solo fechas reales', () => {
    expect(parseIsoDate('2026-02-28')).not.toBeNull();
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('28/02/2026')).toBeNull();
  });

  it('suma días y meses sin correrse por la zona horaria', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-01');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01');
    expect(startOfMonth('2026-10-14')).toBe('2026-10-01');
  });

  it('pinta seis semanas que empiezan en lunes', () => {
    const grid = monthGrid('2026-10-01');
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe('2026-09-28');
    expect(grid[3]).toBe('2026-10-01');
  });

  it('da los textos en español', () => {
    expect(monthLabel('2026-10-01')).toBe('Octubre 2026');
    expect(dayLabel('2026-10-09')).toBe('9 de octubre de 2026');
    expect(formatDisplayDate('2026-10-09')).toBe('09/10/2026');
    expect(formatDisplayDate('x')).toBe('');
    expect(dayLabel('x')).toBe('');
  });

  it('cuenta los días de un rango con ambos extremos', () => {
    expect(daysInRange('2026-10-01', '2026-10-01')).toBe(1);
    expect(daysInRange('2026-01-01', '2026-12-31')).toBe(365);
  });
});
