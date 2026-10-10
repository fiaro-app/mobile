import { MembersPageSchema, type Member } from '@/features/team/lib/member-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Tope de página del API (`MAX_PAGE_SIZE`): un prestamista pequeño cabe entero en una sola página. */
const PAGE_SIZE = 100;

/** `QUERY /memberships`: colaboradores del prestamista (solo para quien administra; un cobrador recibe 403). */
export function fetchMembers(status?: 'ACTIVE' | 'INACTIVE'): Promise<Result<Member[], ApiFailure>> {
  return authedRequest('/memberships', (body) => MembersPageSchema.parse(body).data, {
    method: 'QUERY',
    body: { page: 1, pageSize: PAGE_SIZE, ...(status ? { status } : {}) },
  });
}
