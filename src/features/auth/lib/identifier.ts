import { z } from 'zod';
import { formatPhoneInput, toMobileE164 } from '@/features/auth/lib/phone';

/**
 * Lo que se manda a iniciar sesión según lo que escribió la persona: un correo (trae `@`) en
 * minúsculas, o un celular en E.164. `null` si no es ninguno de los dos.
 */
export function identifierToSignIn(input: string): string | null {
  const text = input.trim();
  if (text.includes('@')) return z.email().safeParse(text).success ? text.toLowerCase() : null;
  return toMobileE164(text);
}

/** Da formato de celular mientras se escribe, salvo que parezca un correo (letras o `@`). */
export function formatIdentifierInput(input: string): string {
  return /[a-z@]/i.test(input) ? input : formatPhoneInput(input);
}
