import { appendDigit, isValidPin, removeLastDigit } from '@/features/auth/lib/pin-rules';

describe('pin-rules', () => {
  it('acepta solo 4 dígitos', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(['123', '12345', '12a4', ''].some(isValidPin)).toBe(false);
  });

  it('no pasa de 4 dígitos al teclear', () => {
    expect(appendDigit('123', '4')).toBe('1234');
    expect(appendDigit('1234', '5')).toBe('1234');
  });

  it('borra el último dígito', () => {
    expect(removeLastDigit('123')).toBe('12');
    expect(removeLastDigit('')).toBe('');
  });
});
