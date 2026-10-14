import { changePasswordSchema } from '@/features/auth/schemas/change-password-schema';
import { loginSchema } from '@/features/auth/schemas/login-schema';

describe('loginSchema', () => {
  it('acepta un celular y una contraseña cualquiera', () => {
    expect(loginSchema.safeParse({ phone: '300 123 4567', password: 'x' }).success).toBe(true);
  });

  it('rechaza un celular inválido y una contraseña vacía', () => {
    const result = loginSchema.safeParse({ phone: '300 12A 45B6', password: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['phone', 'password']);
  });
});

describe('changePasswordSchema', () => {
  const valid = { currentPassword: 'temporal', newPassword: 'nueva-clave-segura-1', confirmPassword: 'nueva-clave-segura-1' };

  it('acepta una contraseña válida', () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it('exige mínimo 8 caracteres', () => {
    expect(changePasswordSchema.safeParse({ ...valid, newPassword: '1234', confirmPassword: '1234' }).success).toBe(false);
  });

  it('marca la confirmación cuando no coincide', () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: 'otra' });
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });
});
