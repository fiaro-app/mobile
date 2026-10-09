import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { fetchMobileVersion } from '@/features/system/api/system-api';
import { resolveGateStatus, type GateStatus } from '@/features/system/lib/gate-status';
import type { MobileVersion } from '@/features/system/lib/version';

/** Lo que la interfaz necesita de la puerta de entrada. */
export interface AppGate {
  readonly status: GateStatus;
  readonly downloadUrl: string | null;
  readonly retry: () => void;
  readonly retrying: boolean;
}

const INSTALLED_VERSION = Constants.expoConfig?.version ?? '0.0.0';

/**
 * Consulta la versión mínima soportada y resuelve si la app puede abrirse. Es server state, por eso
 * vive en TanStack Query y no en Zustand: `retry()` repite la consulta y `retrying` alimenta el
 * botón "Reintentar". Sin reintentos automáticos: el cobrador decide cuándo reintentar.
 */
export function useAppGate(): AppGate {
  const query = useQuery({
    queryKey: ['system', 'mobile-version'],
    queryFn: fetchMobileVersion,
    retry: false,
    staleTime: 5 * 60_000,
  });
  const result = query.data ?? null;
  const remote: MobileVersion | null = result?.ok ? result.value : null;
  return {
    status: resolveGateStatus(result, INSTALLED_VERSION),
    downloadUrl: remote?.downloadUrl ?? null,
    retry: () => {
      void query.refetch();
    },
    retrying: query.isFetching && result !== null,
  };
}
