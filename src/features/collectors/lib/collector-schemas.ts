import { z } from 'zod';
import { toMobileE164 } from '@/features/auth/lib/phone';

/** Quita espacios, puntos, comas y guiones de la cédula (`1.020.304.050` → `1020304050`). Igual que el contrato del API. */
export function normalizeNationalId(input: string): string {
  return input.replaceAll(/[\s.,-]/g, '');
}

/** Cédula válida: 3 a 10 dígitos sin cero inicial (misma regla que el API). */
const NATIONAL_ID_REGEX = /^[1-9]\d{2,9}$/;

/** Formulario "Registrar cobrador". */
export const CollectorFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Escribe el nombre completo.').max(120, 'El nombre es demasiado largo.'),
  nationalId: z
    .string()
    .trim()
    .min(1, 'Escribe la cédula.')
    .refine((value) => NATIONAL_ID_REGEX.test(normalizeNationalId(value)), 'Escribe una cédula válida (3 a 10 dígitos).'),
  phone: z
    .string()
    .trim()
    .min(1, 'Escribe el celular.')
    .refine((value) => toMobileE164(value) !== null, 'Escribe un celular colombiano válido, por ejemplo 300 123 4567.'),
  /** Obligatorio (D-120): es por donde le llegan su contraseña temporal y los avisos. */
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Escribe el correo del cobrador: ahí le llegan su contraseña y los avisos.')
    .refine((value) => z.email().safeParse(value).success, 'Escribe un correo válido, por ejemplo cobrador@correo.com.'),
  portfolioId: z.string().min(1, 'Elige la cartera del cobrador.'),
});
export type CollectorFormValues = z.infer<typeof CollectorFormSchema>;

/** Cuerpo de `POST /memberships` para un cobrador. */
export function toInviteBody(values: CollectorFormValues) {
  return {
    phone: toMobileE164(values.phone) ?? values.phone,
    fullName: values.fullName,
    nationalId: normalizeNationalId(values.nationalId),
    contactEmail: values.contactEmail,
    roles: ['COLLECTOR'] as const,
    portfolioId: values.portfolioId,
  };
}

/** Respuesta de invitar: la contraseña temporal viene en claro SOLO la primera vez (si la persona no tenía cuenta). */
export const InvitedSchema = z.object({ membership: z.object({ id: z.string() }), tempPassword: z.string().nullable() });
export type Invited = z.infer<typeof InvitedSchema>;

/** Respuesta de restablecer la contraseña. */
export const ResetPasswordSchema = z.object({ tempPassword: z.string() });

/** Una cartera del prestamista. */
export const PortfolioSchema = z.object({ id: z.string(), name: z.string(), isDefault: z.boolean() });
export type Portfolio = z.infer<typeof PortfolioSchema>;
