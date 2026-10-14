import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchClientById } from '@/features/clients/api/clients-api';
import type { Client } from '@/features/clients/lib/client-schemas';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/**
 * Nombre de cada cliente por `id`, para las listas que solo traen el `clientId` (préstamos, cuadres). Usa la misma
 * clave de caché que la ficha (`['admin','client',id]`): lo que ya se vio no se vuelve a pedir y lo que se carga
 * aquí sirve luego a la ficha. Los `id` repetidos se piden una sola vez. Mientras llega, el nombre falta en el mapa.
 */
export function useClientNames(ids: readonly string[]): ReadonlyMap<string, string> {
  const unique = useMemo(() => [...new Set(ids)], [ids]);
  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: ['admin', 'client', id],
      staleTime: 60_000,
      queryFn: async (): Promise<Client> => unwrapOrThrow(await fetchClientById(id)),
    })),
  });
  return useMemo(() => {
    const names = new Map<string, string>();
    results.forEach((result, index) => {
      const id = unique[index];
      if (id !== undefined && result.data) names.set(id, result.data.fullName);
    });
    return names;
  }, [results, unique]);
}
