import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/features/auth/store/session-store';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchDailySummary, fetchSettlement } from '@/features/settlement/api/settlement-api';
import type { DailySummary, Settlement } from '@/features/settlement/lib/settlement-schemas';
import { recallSettlement } from '@/features/settlement/store/settlement-memory';
import { businessDateOf } from '@/lib/business-date';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Clave del cuadre ya enviado: se reemplaza su dato en caché al enviar uno nuevo. */
export const settlementKey = (userId: string, date: string) => ['collector', 'settlement', userId, date] as const;

function check<T>(result: Result<T, ApiFailure>): T {
  if (!result.ok) signOutIfSessionExpired(result.failure);
  return unwrapOrThrow(result);
}

/** En qué punto está el día del cobrador: puede cobrar (`open`), espera revisión (`in-review`) o se cerró (`approved`). */
export type DayPhase = 'open' | 'in-review' | 'approved';

/** El cuadre rechazado o inexistente deja el día abierto; en revisión o aprobado, el cobrador ya no puede cobrar. */
export function dayPhase(settlement: Settlement | null | undefined): DayPhase {
  if (settlement?.status === 'APPROVED') return 'approved';
  return settlement?.status === 'PENDING' ? 'in-review' : 'open';
}

/** La fase del día de hoy de la persona de la sesión, según el cuadre que envió desde este teléfono. */
export function useDayPhase(): DayPhase {
  const userId = useSessionStore((state) => state.user?.id ?? '');
  const today = businessDateOf();
  const sent = useSentSettlement(userId, today);
  return dayPhase(sent.data);
}

/** Resumen del día (esperado y cobrado). Se lanza el error para que la caché conserve el último dato bueno. */
export function useDailySummary() {
  return useQuery<DailySummary>({
    queryKey: ['collector', 'daily-summary'],
    queryFn: async () => check(await fetchDailySummary()),
    staleTime: 15_000,
  });
}

/**
 * El cuadre que esta persona ya envió hoy desde este teléfono, con su estado actual, o `null` si no hay.
 * Solo se consulta cuando ya se conoce la fecha del resumen.
 */
export function useSentSettlement(userId: string, date: string | undefined) {
  return useQuery<Settlement | null>({
    queryKey: settlementKey(userId, date ?? ''),
    enabled: date !== undefined,
    queryFn: async () => {
      const id = await recallSettlement(userId, date ?? '');
      return id ? check(await fetchSettlement(id)) : null;
    },
    staleTime: 15_000,
  });
}
