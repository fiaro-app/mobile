import { businessDateOf, formatShortDate } from '@/lib/business-date';

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
