import { formatPhoneInput, toMobileE164 } from '@/features/auth/lib/phone';

describe('toMobileE164', () => {
  it.each([
    ['300 123 4567', '+573001234567'],
    ['3001234567', '+573001234567'],
    ['+57 300-123-4567', '+573001234567'],
    ['573001234567', '+573001234567'],
  ])('convierte %s', (input, expected) => {
    expect(toMobileE164(input)).toBe(expected);
  });

  it.each(['', '300 12A 45B6', '300 123 456', '200 123 4567', '601 234 5678', '+1 300 123 4567'])(
    'rechaza %s',
    (input) => {
      expect(toMobileE164(input)).toBeNull();
    },
  );
});

describe('formatPhoneInput', () => {
  it.each([
    ['3', '3'],
    ['300', '300'],
    ['3001', '300 1'],
    ['3001234', '300 123 4'],
    ['3001234567', '300 123 4567'],
    ['30012345678999', '300 123 4567'],
    ['+57 300 123 4567', '300 123 4567'],
    ['300-12A', '300 12'],
  ])('%s -> %s', (input, expected) => {
    expect(formatPhoneInput(input)).toBe(expected);
  });
});
