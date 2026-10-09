import { useQuery } from '@tanstack/react-query';
import { bootSession } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import { useAppGate } from '@/features/system/hooks/use-app-gate';
import type { BlockedKind } from '@/lib/blocked';

/** Resultado del arranque: o está listo, o sigue cargando, o está bloqueado por una razón. */
export interface Bootstrap {
  readonly ready: boolean;
  readonly blocked: BlockedKind | null;
  readonly downloadUrl: string | null;
  readonly retrying: boolean;
  readonly retry: () => void;
}

/**
 * Arranque de la app en dos pasos: (1) la puerta de versión (`GET /mobile/version`) y (2) restaurar
 * la sesión guardada. Cualquiera de los dos puede dejar la app bloqueada (sin conexión,
 * mantenimiento, versión vieja); `retry` repite el paso que falló. La puerta va primero a propósito:
 * con una versión sin soporte ni siquiera se debe intentar leer la sesión.
 *
 * Restaurar la sesión es una query solo por comodidad (estado de carga, repetición y que no corra
 * dos veces en paralelo): el resultado real queda en `useSessionStore`, no en la caché de la query.
 */
export function useBootstrap(): Bootstrap {
  const gate = useAppGate();
  const sessionReady = useSessionStore((state) => state.ready);
  const restore = useQuery({
    queryKey: ['session', 'restore'],
    queryFn: bootSession,
    enabled: gate.status === 'ok' && !sessionReady,
    retry: false,
    gcTime: 0,
  });

  const gateBlocked = gate.status === 'ok' || gate.status === 'checking' ? null : gate.status;
  const failure = restore.data ?? null;
  let sessionBlocked: BlockedKind | null = null;
  if (failure) sessionBlocked = failure.kind === 'maintenance' ? 'maintenance' : 'offline';

  return {
    ready: gate.status === 'ok' && sessionReady,
    blocked: gateBlocked ?? sessionBlocked,
    downloadUrl: gate.downloadUrl,
    retrying: gate.retrying || restore.isFetching,
    retry: () => {
      if (gateBlocked) gate.retry();
      else void restore.refetch();
    },
  };
}
