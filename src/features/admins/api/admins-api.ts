import { InvitedSchema, type Invited } from '@/features/collectors/lib/collector-schemas';
import { toInviteAdminBody, type AdminFormValues } from '@/features/admins/lib/admin-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** `POST /memberships`: invita a un administrador. Si no tenía cuenta, devuelve su contraseña temporal (una sola vez). */
export function inviteAdmin(values: AdminFormValues): Response<Invited> {
  return authedRequest('/memberships', (body) => InvitedSchema.parse(body), { method: 'POST', body: toInviteAdminBody(values) });
}

/** `PATCH /memberships/:id/roles`: reemplaza los roles completos (la API exige al menos uno). */
export function changeRoles(membershipId: string, roles: readonly string[]): Response<unknown> {
  return authedRequest(`/memberships/${membershipId}/roles`, (body) => body, { method: 'PATCH', body: { roles } });
}

/** `POST /memberships/:id/deactivate`: quita el acceso de inmediato y conserva el historial. */
export function deactivateMember(membershipId: string): Response<unknown> {
  return authedRequest(`/memberships/${membershipId}/deactivate`, (body) => body, { method: 'POST', body: {} });
}
