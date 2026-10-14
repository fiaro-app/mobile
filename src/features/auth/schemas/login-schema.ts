import { z } from 'zod';
import { AUTH_COPY } from '@/features/auth/content/messages';
import { toMobileE164 } from '@/features/auth/lib/phone';

/**
 * Validación del formulario de inicio de sesión, la misma que ve la persona mientras escribe. La
 * contraseña solo exige no estar vacía a propósito: el API valida su longitud al crearla, no al
 * usarla, para no revelar la política a quien prueba contraseñas (ver `SignInRequestSchema` del
 * API). Por eso el mock "Validación en tiempo real" no pide mínimo de largo aquí.
 */
export const loginSchema = z.object({
  phone: z.string().refine((value) => toMobileE164(value) !== null, { message: AUTH_COPY.validation.phone }),
  password: z.string().min(1, AUTH_COPY.validation.passwordRequired),
});
export type LoginValues = z.infer<typeof loginSchema>;
