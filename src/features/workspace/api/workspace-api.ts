import { z } from 'zod';
import { RoleSchema, type Role } from '@/features/workspace/lib/roles';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';
import { ok, fail } from '@/lib/result';

const OwnMembershipSchema = z.object({ roles: z.array(RoleSchema) });

/** Datos públicos del prestamista de la sesión. */
export const LenderSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
});
export type Lender = z.infer<typeof LenderSchema>;

/**
 * Los roles de la persona en su prestamista (`GET /memberships/me`, D-124). Sirve a cualquier rol, también al
 * cobrador; antes se deducía buscándose en la primera página de `QUERY /memberships`, y en un negocio con más de
 * 50 colaboradores el dueño podía no aparecer y abrir como cobrador.
 */
export async function fetchOwnRoles(): Promise<Result<Role[], ApiFailure>> {
  const result = await authedRequest('/memberships/me', (body) => OwnMembershipSchema.parse(body));
  return result.ok ? ok(result.value.roles) : fail(result.failure);
}

/** `GET /lender`: nombre, logo y color de marca del prestamista (sirve a ambos modos). */
export function fetchLender(): Promise<Result<Lender, ApiFailure>> {
  return authedRequest('/lender', (body) => LenderSchema.parse(body));
}
