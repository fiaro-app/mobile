import { useQuery } from '@tanstack/react-query';
import { fetchBalance, fetchClient, fetchLoan, fetchVisits } from '@/features/client-detail/api/client-detail-api';
import { buildClientDetail, type ClientDetailModel } from '@/features/client-detail/lib/detail-view-model';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { failureOf, unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Estado de la pantalla: cargando, lista o con el fallo que impidió cargarla. */
export type ClientDetailState = 'loading' | 'ready' | 'offline' | 'maintenance' | 'error';

/** Lo que la pantalla de detalle necesita. */
export interface ClientDetail {
  readonly state: ClientDetailState;
  readonly model: ClientDetailModel | null;
  readonly refreshing: boolean;
  readonly refresh: () => void;
}

async function load<T>(request: Promise<Result<T, ApiFailure>>): Promise<T> {
  const result = await request;
  if (!result.ok) signOutIfSessionExpired(result.failure);
  return unwrapOrThrow(result);
}

function stateOf(failure: ApiFailure | null): ClientDetailState {
  if (!failure) return 'loading';
  if (failure.kind === 'offline') return 'offline';
  return failure.kind === 'maintenance' ? 'maintenance' : 'error';
}

/**
 * Carga lo que el detalle necesita (cliente, préstamo, saldo y visitas) en cuatro consultas
 * independientes que corren en paralelo, y arma el modelo cuando llegan todas. Cada una conserva su
 * último dato bueno si un refresco falla, así que sin conexión se sigue viendo lo ya cargado. El saldo
 * y el historial cambian con cada visita, por eso `staleTime` es corto (15 s).
 *
 * @param clientId - Cliente a mostrar.
 * @param loanId - Préstamo del que se muestran saldo e historial.
 */
export function useClientDetail(clientId: string, loanId: string): ClientDetail {
  const options = { staleTime: 15_000 } as const;
  const client = useQuery({ queryKey: ['client', clientId], queryFn: () => load(fetchClient(clientId)), ...options });
  const loan = useQuery({ queryKey: ['loan', loanId], queryFn: () => load(fetchLoan(loanId)), ...options });
  const balance = useQuery({ queryKey: ['loan', loanId, 'balance'], queryFn: () => load(fetchBalance(loanId)), ...options });
  const visits = useQuery({ queryKey: ['loan', loanId, 'visits'], queryFn: () => load(fetchVisits(loanId)), ...options });

  const all = [client, loan, balance, visits];
  const ready = client.data && loan.data && balance.data && visits.data;
  const model = ready ? buildClientDetail({ client: client.data, loan: loan.data, balance: balance.data, visits: visits.data }) : null;
  const failure = all.map((query) => failureOf(query.error)).find((value) => value !== null) ?? null;

  return {
    state: model ? 'ready' : stateOf(failure),
    model,
    refreshing: model !== null && all.some((query) => query.isFetching),
    refresh: () => {
      all.forEach((query) => void query.refetch());
    },
  };
}
