import { useQuery } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/**
 * Consulta a una ruta del API con las reglas de siempre: si el servicio falla se LANZA el error (para que TanStack
 * Query conserve el último dato bueno), un 401 cierra la sesión local, y `staleTime` de 30 s evita repetir la
 * consulta al volver rápido a la pantalla. Úsalo en lugar de repetir ese bloque en cada hook.
 *
 * @param key - Clave de caché.
 * @param fetcher - Llamada al servicio (`Result`).
 * @param enabled - `false` para no pedir todavía (por ejemplo, sin `id`).
 */
export function useApiQuery<T>(key: readonly unknown[], fetcher: () => Promise<Result<T, ApiFailure>>, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const result = await fetcher();
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
  });
}
