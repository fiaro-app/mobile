import { postVisit } from '@/features/visit/api/visit-api';
import type { VisitRequest } from '@/features/visit/lib/visit-request';
import { isPermanentRejection, refreshSyncCounts } from '@/features/visit/queue/flush-queue';
import { enqueueVisit } from '@/features/visit/queue/visit-queue';
import type { ApiFailure } from '@/lib/http/failure';

/**
 * Qué pasó al registrar la visita:
 * - `sent`: el API la guardó.
 * - `queued`: no hubo conexión (o el API no respondió bien): quedó en el teléfono y se enviará sola.
 * - `rejected`: el API la rechazó de forma definitiva; la persona debe verlo y corregir.
 * - `session-expired`: la sesión murió; nada se guardó para no perder la visita en una cuenta que ya no existe.
 */
export type SubmitOutcome =
  | { readonly kind: 'sent' }
  | { readonly kind: 'queued' }
  | { readonly kind: 'rejected'; readonly failure: ApiFailure }
  | { readonly kind: 'session-expired' };

export interface SubmitInput {
  readonly userId: string;
  readonly loanId: string;
  readonly clientName: string;
  readonly request: VisitRequest;
}

/**
 * Registra una visita priorizando que NUNCA se pierda. Primero intenta enviarla; si falla por algo
 * pasajero la guarda en la cola local (con el mismo `id`, así reenviarla después no duplica nada). El
 * cobrador en campo no debe quedarse sin poder registrar un cobro por falta de señal.
 */
export async function submitVisit(input: SubmitInput): Promise<SubmitOutcome> {
  const result = await postVisit(input.loanId, input.request);
  if (result.ok) return { kind: 'sent' };
  if (result.failure.kind === 'http' && result.failure.status === 401) return { kind: 'session-expired' };
  if (isPermanentRejection(result.failure)) return { kind: 'rejected', failure: result.failure };
  await enqueueVisit({ userId: input.userId, loanId: input.loanId, clientName: input.clientName, request: input.request });
  await refreshSyncCounts(input.userId);
  return { kind: 'queued' };
}
