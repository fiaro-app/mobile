import { z } from 'zod';
import { RoleSchema, type Role } from '@/features/workspace/lib/roles';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';
import { ok, fail } from '@/lib/result';

const MembershipsPageSchema = z.object({
  data: z.array(z.object({ userId: z.string(), roles: z.array(RoleSchema) })),
});

/** Datos públicos del prestamista de la sesión. */
export const LenderSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
});
export type Lender = z.infer<typeof LenderSchema>;

/**
 * Los roles de la persona en su prestamista. El API no tiene "mis roles": se listan las membresías activas
 * (`QUERY /memberships`) y se busca la propia. Solo quien administra puede listar; un cobrador recibe 403
 * `FORBIDDEN`, y eso mismo dice que es cobrador (así lo resuelve también la web).
 */
export async function fetchOwnRoles(userId: string): Promise<Result<Role[], ApiFailure>> {
  const result = await authedRequest('/memberships', (body) => MembershipsPageSchema.parse(body), {
    method: 'QUERY',
    body: { page: 1, pageSize: 50, status: 'ACTIVE' },
  });
  if (result.ok) return ok(result.value.data.find((membership) => membership.userId === userId)?.roles ?? []);
  if (result.failure.kind === 'http' && result.failure.status === 403) return ok<Role[]>(["COLLECTOR"]);
  return fail(result.failure);
}

/** `GET /lender`: nombre, logo y color de marca del prestamista (sirve a ambos modos). */
export function fetchLender(): Promise<Result<Lender, ApiFailure>> {
  return authedRequest('/lender', (body) => LenderSchema.parse(body));
}
