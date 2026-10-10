import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { shouldLock } from '@/features/auth/lib/inactivity';
import { useSessionStore } from '@/features/auth/store/session-store';

/**
 * Vuelve a pedir el PIN cuando la app regresa de segundo plano tras más de un minuto fuera (`LOCK_AFTER_MS`). Sin esto el PIN solo
 * protegía el arranque en frío: alguien que tomara un teléfono con la app "dormida" entraba sin PIN. Solo actúa con sesión abierta
 * y PIN activado (`lock` no hace nada sin PIN). Se anota cuándo se fue a segundo plano y se compara al volver.
 *
 * @param active - `true` cuando hay una sesión lista (acceso `signed-in`).
 */
export function useInactivityLock(active: boolean): void {
  const lock = useSessionStore((state) => state.lock);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundedAt.current = Date.now();
        return;
      }
      if (state === 'active') {
        if (shouldLock(backgroundedAt.current, Date.now())) lock();
        backgroundedAt.current = null;
      }
    });
    return () => {
      subscription.remove();
    };
  }, [active, lock]);
}
