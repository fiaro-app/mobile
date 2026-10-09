import { firstName, initials } from '@/features/auth/lib/names';

describe('names', () => {
  it('toma el primer nombre', () => {
    expect(firstName('  Alejo  Pérez ')).toBe('Alejo');
    expect(firstName('')).toBe('');
  });

  it('arma las iniciales con primer y último nombre', () => {
    expect(initials('Juan Alejo Pérez')).toBe('JP');
    expect(initials('alejo')).toBe('A');
    expect(initials('')).toBe('');
  });
});
