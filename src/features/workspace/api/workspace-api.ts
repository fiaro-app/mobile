import { z } from 'zod';
import { RoleSchema } from '@/features/workspace/lib/roles';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

const OwnMembershipSchema = z.object({ id: z.string(), roles: z.array(RoleSchema) });

/** La membresía de la sesión: su id y sus roles. */
export type OwnMembership = z.infer<typeof OwnMembershipSchema>;

/** Datos públicos del prestamista de la sesión. */
export const LenderSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
});
export type Lender = z.infer<typeof LenderSchema>;

/**
 * La membresía de la persona en su prestamista, con su id y sus roles (`GET /memberships/me`, D-124). Sirve a cualquier rol, también al
 * cobrador; antes se deducía buscándose en la primera página de `QUERY /memberships`, y en un negocio con más de
 * 50 colaboradores el dueño podía no aparecer y abrir como cobrador.
 */
export function fetchOwnMembership(): Promise<Result<OwnMembership, ApiFailure>> {
  return authedRequest('/memberships/me', (body) => OwnMembershipSchema.parse(body));
}

/** `GET /lender`: nombre, logo y color de marca del prestamista (sirve a ambos modos). */
export function fetchLender(): Promise<Result<Lender, ApiFailure>> {
  return authedRequest('/lender', (body) => LenderSchema.parse(body));
}
