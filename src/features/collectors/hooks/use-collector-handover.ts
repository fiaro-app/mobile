import { useQuery } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchCollectorActiveLoanIds } from '@/features/collectors/api/collectors-api';
import type { Member } from '@/features/team/lib/member-schemas';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/**
 * Lo que hace falta para dar de baja a un cobrador sin dejar préstamos sin cobrador (D-97): sus préstamos activos de
 * hoy (solo si está activo) y los otros cobradores activos que pueden recibirlos.
 *
 * @param id - `membershipId` del cobrador.
 * @param member - Su membresía, si ya cargó.
 * @param members - Los colaboradores del prestamista.
 */
export function useCollectorHandover(id: string, member: Member | null, members: readonly Member[]) {
  const handover = useQuery({
    queryKey: ['admin', 'collector-handover', id],
    enabled: member?.status === 'ACTIVE',
    staleTime: 0,
    queryFn: async () => {
      const result = await fetchCollectorActiveLoanIds(id);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
  });
  const destinations = members.filter((item) => item.id !== id && item.status === 'ACTIVE' && item.roles.includes('COLLECTOR'));
  return { handover, destinations };
}
