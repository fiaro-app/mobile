import { useQueryClient } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { flushVisitQueue, refreshSyncCounts } from '@/features/visit/queue/flush-queue';
import { useSyncStore } from '@/features/visit/queue/sync-store';

/** Cada cuánto se reintenta enviar mientras hay visitas pendientes (ms). */
export const RETRY_INTERVAL_MS = 30_000;

/**
 * Mantiene al día la cola de visitas sin conexión mientras hay una persona con sesión: al abrir la app,
 * cuando vuelve la conexión, cuando la app regresa al primer plano y cada `RETRY_INTERVAL_MS` mientras haya
 * pendientes (la red puede estar bien y el servidor caído: ningún evento del sistema lo avisaría) intenta
 * enviar lo pendiente. Sin usuario no hace nada (y las visitas de otra persona nunca se envían, ver `flushVisitQueue`).
 *
 * @param userId - Persona con sesión, o `null` si no hay.
 */
export function useVisitQueueSync(userId: string | null): void {
  const pending = useSyncStore((state) => state.pending);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return undefined;
    const sync = () => {
      void flushVisitQueue(userId).then((sent) => {
        if (sent > 0) void queryClient.invalidateQueries();
      });
    };
    void refreshSyncCounts(userId).then(sync);
    const network = Network.addNetworkStateListener((state) => {
      if (state.isConnected) sync();
    });
    const appState = AppState.addEventListener('change', (status) => {
      if (status === 'active') sync();
    });
    return () => {
      network.remove();
      appState.remove();
    };
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId || pending === 0) return undefined;
    const timer = setInterval(() => {
      void flushVisitQueue(userId).then((sent) => {
        if (sent > 0) void queryClient.invalidateQueries();
      });
    }, RETRY_INTERVAL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [userId, pending, queryClient]);
}
