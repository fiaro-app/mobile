import { businessDateOf, formatShortDate, formatWeekdayDay } from '@/lib/business-date';

describe('businessDateOf', () => {
  it('usa la fecha de Colombia, no la de UTC', () => {
    expect(businessDateOf(new Date('2026-10-10T02:30:00Z'))).toBe('2026-10-09');
    expect(businessDateOf(new Date('2026-10-09T15:00:00Z'))).toBe('2026-10-09');
  });
});

describe('formatShortDate', () => {
  it('formatea una fecha de negocio', () => {
    expect(formatShortDate('2026-09-12')).toBe('12 sep 2026');
    expect(formatShortDate('2026-01-05')).toBe('5 ene 2026');
  });

  it('convierte un instante a la fecha de Colombia antes de formatear', () => {
    expect(formatShortDate('2026-09-13T03:00:00Z')).toBe('12 sep 2026');
  });

  it('deja el texto como llegó si no es una fecha', () => {
    expect(formatShortDate('2026-13-01')).toBe('2026-13-01');
  });
});

describe('formatWeekdayDay', () => {
  it('escribe el día de la semana y el número', () => {
    expect(formatWeekdayDay('2026-10-12')).toBe('lun 12');
    expect(formatWeekdayDay('2026-10-04')).toBe('dom 4');
    expect(formatWeekdayDay('2026-10-14')).toBe('mié 14');
  });

  it('no corre el día por la zona horaria', () => {
    expect(formatWeekdayDay('2026-01-01')).toBe('jue 1');
    expect(formatWeekdayDay('2026-12-31')).toBe('jue 31');
  });

  it('devuelve tal cual lo que no es una fecha', () => {
    expect(formatWeekdayDay('ayer')).toBe('ayer');
  });
});
