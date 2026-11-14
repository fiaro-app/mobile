import { formatIdentifierInput, identifierToSignIn } from '@/features/auth/lib/identifier';

describe('identifierToSignIn', () => {
  it('manda un correo en minúsculas y un celular en E.164', () => {
    expect(identifierToSignIn(' Ana@Correo.com ')).toBe('ana@correo.com');
    expect(identifierToSignIn('300 123 4567')).toBe('+573001234567');
  });

  it('rechaza lo que no es un correo ni un celular', () => {
    expect(identifierToSignIn('ana@')).toBeNull();
    expect(identifierToSignIn('hola')).toBeNull();
    expect(identifierToSignIn('')).toBeNull();
  });
});

describe('formatIdentifierInput', () => {
  it('da formato de celular a los dígitos y deja intacto lo que parece un correo', () => {
    expect(formatIdentifierInput('3001234567')).toBe('300 123 4567');
    expect(formatIdentifierInput('ana@co')).toBe('ana@co');
  });
});
