import { useQuery } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchClientById, fetchClientLoans } from '@/features/clients/api/clients-api';
import type { Client } from '@/features/clients/lib/client-schemas';
import type { LoanListItem } from '@/features/loans/lib/loan-schemas';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Un cliente por `id` (ficha y edición). La caché se comparte entre ambas pantallas. */
export function useClientQuery(id: string | undefined) {
  return useQuery<Client>({
    queryKey: ['admin', 'client', id],
    enabled: id !== undefined,
    staleTime: 30_000,
    queryFn: async () => {
      const result = await fetchClientById(id ?? '');
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
  });
}

/** Préstamos de un cliente (los 20 más recientes). */
export function useClientLoansQuery(id: string) {
  return useQuery<LoanListItem[]>({
    queryKey: ['admin', 'client-loans', id],
    staleTime: 30_000,
    queryFn: async () => {
      const result = await fetchClientLoans(id);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
  });
}
