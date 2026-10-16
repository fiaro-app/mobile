import { toMobileE164 } from '@/features/auth/lib/phone';
import { CollectorFormSchema, normalizeNationalId } from '@/features/collectors/lib/collector-schemas';
import { z } from 'zod';

/** Formulario "Invitar administrador": los datos de una persona, sin cartera (no cobra). */
export const AdminFormSchema = CollectorFormSchema.omit({ portfolioId: true }).extend({
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Escribe el correo del administrador: ahí le llegan su contraseña y los avisos.')
    .refine((value) => z.email().safeParse(value).success, 'Escribe un correo válido, por ejemplo admin@correo.com.'),
});
export type AdminFormValues = z.infer<typeof AdminFormSchema>;

/** Cuerpo de `POST /memberships` para alguien que solo administra. */
export function toInviteAdminBody(values: AdminFormValues) {
  return {
    phone: toMobileE164(values.phone) ?? values.phone,
    fullName: values.fullName.trim(),
    nationalId: normalizeNationalId(values.nationalId),
    contactEmail: values.contactEmail.trim(),
    roles: ['LENDER'],
  };
}
