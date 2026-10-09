import { useQuery } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchDailySummary, fetchSettlement } from '@/features/settlement/api/settlement-api';
import type { DailySummary, Settlement } from '@/features/settlement/lib/settlement-schemas';
import { recallSettlement } from '@/features/settlement/store/settlement-memory';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Clave del cuadre ya enviado: se reemplaza su dato en caché al enviar uno nuevo. */
export const settlementKey = (userId: string, date: string) => ['collector', 'settlement', userId, date] as const;

function check<T>(result: Result<T, ApiFailure>): T {
  if (!result.ok) signOutIfSessionExpired(result.failure);
  return unwrapOrThrow(result);
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
