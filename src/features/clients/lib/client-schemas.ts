import { z } from 'zod';
import { toMobileE164 } from '@/features/auth/lib/phone';
import { normalizeNationalId } from '@/features/collectors/lib/collector-schemas';

/** Cliente completo (`GET /clients/:id`, `POST /clients`). */
export const ClientSchema = z.object({
  id: z.string(),
  nationalId: z.string(),
  fullName: z.string(),
  occupation: z.string(),
  phone: z.string(),
  address: z.string(),
});
export type Client = z.infer<typeof ClientSchema>;

/** Fila de `QUERY /clients`: el cliente más lo que debe hoy. */
export const ClientListItemSchema = ClientSchema.extend({
  balance: z.int(),
  overdueAmount: z.int(),
  overdueDays: z.int(),
  activeLoans: z.int(),
});
export type ClientListItem = z.infer<typeof ClientListItemSchema>;

/** Página de clientes. */
export const ClientsPageSchema = z.object({ data: z.array(ClientListItemSchema), meta: z.object({ total: z.number() }) });

/** Formulario "Registrar / Editar cliente". */
export const ClientFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Escribe el nombre completo.').max(120, 'El nombre es demasiado largo.'),
  nationalId: z
    .string()
    .trim()
    .min(1, 'Escribe la cédula.')
    .refine((value) => /^[1-9]\d{2,9}$/.test(normalizeNationalId(value)), 'Escribe una cédula válida (3 a 10 dígitos).'),
  phone: z
    .string()
    .trim()
    .min(1, 'Escribe el teléfono.')
    .refine((value) => toMobileE164(value) !== null, 'Escribe un celular colombiano válido, por ejemplo 300 123 4567.'),
  occupation: z.string().trim().min(1, 'Escribe el oficio.').max(120, 'El oficio es demasiado largo.'),
  address: z.string().trim().min(1, 'Escribe la dirección.').max(250, 'La dirección es demasiado larga.'),
});
export type ClientFormValues = z.infer<typeof ClientFormSchema>;

/** Valores del formulario ya normalizados al formato del API (cédula sin puntos, celular E.164). */
export function toClientBody(values: ClientFormValues): ClientFormValues {
  return {
    fullName: values.fullName,
    nationalId: normalizeNationalId(values.nationalId),
    phone: toMobileE164(values.phone) ?? values.phone,
    occupation: values.occupation,
    address: values.address,
  };
}

/** Solo los campos que cambiaron (el PATCH exige al menos uno), o `null` si no cambió nada. */
export function toClientChanges(values: ClientFormValues, current: Client): Partial<ClientFormValues> | null {
  const next = toClientBody(values);
  const changes: Partial<ClientFormValues> = {};
  for (const field of ['fullName', 'nationalId', 'phone', 'occupation', 'address'] as const) {
    if (next[field] !== current[field]) changes[field] = next[field];
  }
  return Object.keys(changes).length === 0 ? null : changes;
}
