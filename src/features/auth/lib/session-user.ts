import { z } from 'zod';

/**
 * Persona con sesión abierta, con lo mínimo que la app usa. Se arma desde la respuesta de
 * better-auth (`AuthUser`), cuyos campos se llaman distinto (`name`, `phoneNumber`).
 */
export interface SessionUser {
  readonly id: string;
  readonly fullName: string;
  readonly phone: string;
  readonly mustChangePassword: boolean;
  /** Correo de contacto (recuperación y avisos); ausente o `null` si no tiene. */
  readonly contactEmail?: string | null;
  /** `true` si ya confirmó el correo con el código que recibió. */
  readonly contactEmailVerified?: boolean;
}

const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  mustChangePassword: z.boolean(),
  contactEmail: z.string().nullish(),
  contactEmailVerified: z.boolean().nullish(),
});

/**
 * Convierte el `user` de una respuesta de better-auth en un `SessionUser`.
 *
 * @throws Si el cuerpo no tiene la forma esperada (el servicio lo captura como fallo de respuesta).
 */
export function toSessionUser(authUser: unknown): SessionUser {
  const parsed = AuthUserSchema.parse(authUser);
  return {
    id: parsed.id,
    fullName: parsed.name,
    phone: parsed.phoneNumber,
    mustChangePassword: parsed.mustChangePassword,
    contactEmail: parsed.contactEmail ?? null,
    contactEmailVerified: parsed.contactEmailVerified ?? false,
  };
}
