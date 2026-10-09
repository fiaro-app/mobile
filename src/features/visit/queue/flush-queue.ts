import { postVisit } from '@/features/visit/api/visit-api';
import { markRejected, readQueueFor, removeVisit } from '@/features/visit/queue/visit-queue';
import { useSyncStore } from '@/features/visit/queue/sync-store';
import type { ApiFailure } from '@/lib/http/failure';

/**
 * Si el API respondió con un error DEFINITIVO: reintentar daría lo mismo (el cuerpo es inválido, no hay
 * permiso o asignación, el préstamo no existe). `401` no cuenta: es la sesión, no la visita. `408`, `429`
 * y `5xx` son pasajeros.
 */
export function isPermanentRejection(failure: ApiFailure): boolean {
  if (failure.kind !== 'http') return false;
  const { status } = failure;
  return status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
}

/** Recalcula los contadores del aviso a partir de la cola guardada. */
export async function refreshSyncCounts(userId: string): Promise<void> {
  const items = await readQueueFor(userId);
  const pending = items.filter((item) => item.status === 'pending').length;
  useSyncStore.getState().setCounts(pending, items.length - pending);
}

let flushing: Promise<number> | null = null;

async function runFlush(userId: string): Promise<number> {
  let sent = 0;
  const pending = (await readQueueFor(userId)).filter((item) => item.status === 'pending');
  for (const item of pending) {
    const result = await postVisit(item.loanId, item.request);
    if (result.ok) {
      await removeVisit(item.request.id);
      sent += 1;
    } else if (isPermanentRejection(result.failure)) {
      await markRejected(item.request.id, result.failure.kind === 'http' ? result.failure.code : null);
    } else {
      break;
    }
  }
  await refreshSyncCounts(userId);
  return sent;
}

/**
 * Envía en orden las visitas pendientes de la persona. Se detiene ante el primer fallo pasajero (sin red,
 * mantenimiento, 5xx, sesión vencida): seguir mandando las demás solo gastaría batería y las dejaría
 * fuera de orden. Dos llamadas a la vez comparten el mismo envío (nunca corre doble).
 */
export function flushVisitQueue(userId: string): Promise<number> {
  flushing ??= runFlush(userId).finally(() => {
    flushing = null;
  });
  return flushing;
}
