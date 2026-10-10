import { accountFailureMessage } from '@/features/account/content/messages';
import { isValidEmailCode, ProfileFormSchema, ProfileResponseSchema, toProfileChanges } from '@/features/account/lib/profile-schemas';

const current = { fullName: 'Ana Pérez', contactEmail: 'ana@correo.com' };
const http = (status: number, code: string | null = null) => ({ kind: 'http', status, code, retryAfterSeconds: null }) as const;

describe('formulario de perfil', () => {
  it('valida nombre y correo (el correo vacío es válido)', () => {
    expect(ProfileFormSchema.safeParse({ fullName: ' ', contactEmail: '' }).success).toBe(false);
    expect(ProfileFormSchema.safeParse({ fullName: 'A', contactEmail: 'no-es-correo' }).success).toBe(false);
    expect(ProfileFormSchema.safeParse({ fullName: 'A', contactEmail: '' }).success).toBe(true);
    expect(ProfileFormSchema.safeParse({ fullName: 'A', contactEmail: 'a@b.co' }).success).toBe(true);
    expect(ProfileFormSchema.safeParse({ fullName: 'a'.repeat(121), contactEmail: '' }).success).toBe(false);
  });

  it('envía solo lo que cambió', () => {
    expect(toProfileChanges({ fullName: 'Ana Pérez', contactEmail: 'ana@correo.com' }, current)).toBeNull();
    expect(toProfileChanges({ fullName: 'Ana P.', contactEmail: 'ana@correo.com' }, current)).toEqual({ fullName: 'Ana P.' });
    expect(toProfileChanges({ fullName: 'Ana Pérez', contactEmail: '' }, current)).toEqual({ contactEmail: null });
    expect(toProfileChanges({ fullName: 'Ana Pérez', contactEmail: 'x@y.co' }, { ...current, contactEmail: null })).toEqual({ contactEmail: 'x@y.co' });
  });

  it('el código son exactamente 6 dígitos', () => {
    expect(isValidEmailCode('123456')).toBe(true);
    for (const bad of ['12345', '1234567', '12345a', '']) expect(isValidEmailCode(bad)).toBe(false);
  });

  it('valida la respuesta del API', () => {
    expect(ProfileResponseSchema.parse({ fullName: 'A', contactEmail: null, contactEmailVerified: false }).contactEmail).toBeNull();
    expect(() => ProfileResponseSchema.parse({ fullName: 1 })).toThrow();
  });
});

describe('mensajes de fallo', () => {
  it.each([
    [{ kind: 'offline' }, /Sin conexión/],
    [{ kind: 'maintenance' }, /mantenimiento/],
    [http(409, 'CONTACT_EMAIL_NOT_SET'), /agrega un correo/],
    [http(409, 'CONTACT_EMAIL_ALREADY_VERIFIED'), /ya está verificado/],
    [http(400, 'CONTACT_EMAIL_VERIFICATION_CODE_INVALID'), /no es correcto/],
    [http(400, 'CONTACT_EMAIL_VERIFICATION_CODE_EXPIRED'), /venció/],
    [http(429), /Demasiados intentos/],
    [http(500), /No pudimos/],
  ] as const)('%j', (failure, expected) => {
    expect(accountFailureMessage(failure)).toMatch(expected);
  });
});
