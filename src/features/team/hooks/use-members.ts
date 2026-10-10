import { useQuery } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchMembers } from '@/features/team/api/team-api';
import type { Member } from '@/features/team/lib/member-schemas';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Colaboradores del prestamista (todos los estados). Sirve para resolver nombres (cuadres) y para el listado de cobradores. */
export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: async () => {
      const result = await fetchMembers();
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    staleTime: 30_000,
  });
}
