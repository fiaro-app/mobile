import { z } from 'zod';
import { AUTH_COPY } from '@/features/auth/content/messages';

/** Longitud de contraseña que acepta el API (`PASSWORD_MIN_LENGTH` / `PASSWORD_MAX_LENGTH`). */
export const PASSWORD_MIN = 15;
export const PASSWORD_MAX = 128;

/**
 * Cambio de contraseña del primer ingreso. Pide la temporal porque el API la exige como prueba
 * (`currentPassword` de `POST /auth/change-password`). Que la nueva sea demasiado fácil de
 * adivinar solo lo sabe el API (`PASSWORD_TOO_WEAK`), no se duplica aquí.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, AUTH_COPY.validation.currentRequired),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, AUTH_COPY.validation.passwordMin)
      .max(PASSWORD_MAX, AUTH_COPY.validation.passwordMin),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: AUTH_COPY.validation.passwordMatch,
    path: ['confirmPassword'],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
