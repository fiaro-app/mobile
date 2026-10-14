import type { VisitRequest } from '@/features/visit/lib/visit-request';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/**
 * Registra una visita (`POST /loans/:loanId/collection-visits`). Es IDEMPOTENTE por `request.id` (D-29):
 * reenviar la misma visita no duplica nada y devuelve la ya guardada, por eso es seguro reintentar desde la
 * cola cuando no se sabe si el primer envío llegó. Responde 201 la primera vez.
 */
export function postVisit(loanId: string, request: VisitRequest): Promise<Result<unknown, ApiFailure>> {
  return authedRequest(`/loans/${loanId}/collection-visits`, (body) => body, { method: 'POST', body: request });
}
