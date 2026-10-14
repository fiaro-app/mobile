import { MembersPageSchema, type Member } from '@/features/team/lib/member-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/**
 * Tope de página del API (`MAX_PAGE_SIZE`, 50).
 *
 * shortcut: trae solo la primera página de colaboradores; el plan permite pocos cobradores, paginar si un negocio pasa de 50.
 */
const PAGE_SIZE = 50;

/** `QUERY /memberships`: colaboradores del prestamista (solo para quien administra; un cobrador recibe 403). */
export function fetchMembers(status?: 'ACTIVE' | 'INACTIVE'): Promise<Result<Member[], ApiFailure>> {
  return authedRequest('/memberships', (body) => MembersPageSchema.parse(body).data, {
    method: 'QUERY',
    body: { page: 1, pageSize: PAGE_SIZE, ...(status ? { status } : {}) },
  });
}
