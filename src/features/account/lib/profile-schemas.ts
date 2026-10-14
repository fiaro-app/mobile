import { z } from 'zod';

/** Longitud del código que llega al correo de contacto (`VERIFICATION_CODE_LENGTH` del API). */
export const EMAIL_CODE_LENGTH = 6;

/** Formulario "Editar perfil": nombre y correo de contacto (vacío = sin correo). */
export const ProfileFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Escribe tu nombre completo.').max(120, 'El nombre es demasiado largo.'),
  contactEmail: z
    .string()
    .trim()
    .max(254, 'El correo es demasiado largo.')
    .refine((value) => value === '' || z.email().safeParse(value).success, 'Escribe un correo válido.'),
});
export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

/** Respuesta de `PATCH /account/profile`. */
export const ProfileResponseSchema = z.object({
  fullName: z.string(),
  contactEmail: z.string().nullable(),
  contactEmailVerified: z.boolean(),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

/** Cambios a enviar: solo los campos que cambiaron (el API no toca los ausentes). */
export interface ProfileChanges {
  fullName?: string;
  contactEmail?: string | null;
}

/**
 * Compara el formulario con lo guardado y devuelve solo lo que cambió, o `null` si no cambió nada (entonces no
 * se llama al API: el PATCH exige al menos un campo). Un correo en blanco se envía como `null` (quitarlo).
 */
export function toProfileChanges(values: ProfileFormValues, current: { readonly fullName: string; readonly contactEmail: string | null }): ProfileChanges | null {
  const changes: ProfileChanges = {};
  if (values.fullName !== current.fullName) changes.fullName = values.fullName;
  const email = values.contactEmail === '' ? null : values.contactEmail;
  if (email !== current.contactEmail) changes.contactEmail = email;
  return Object.keys(changes).length === 0 ? null : changes;
}

/** Solo dígitos, del largo exacto del código. */
export function isValidEmailCode(code: string): boolean {
  return new RegExp(String.raw`^\d{${String(EMAIL_CODE_LENGTH)}}$`).test(code);
}
