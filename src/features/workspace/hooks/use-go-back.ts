import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { useAccess } from '@/features/auth/store/session-store';
import type { Mode } from '@/features/workspace/lib/roles';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

/** @returns La pantalla de inicio de cada modo: el Resumen del administrador o la ruta del cobrador. */
export function homeOf(mode: Mode): Href {
  return mode === 'admin' ? '/admin' : '/';
}

/**
 * "Atrás" que nunca deja a la persona atrapada: si no hay pantalla anterior (se abrió por enlace, se recargó la
 * web o se cambió de modo y la anterior ya no existe), lleva al inicio del modo actual, o al login sin sesión.
 * `router.back()` a secas falla en silencio en esos casos y la pantalla se queda sin salida.
 */
export function useGoBack(): () => void {
  const router = useRouter();
  const access = useAccess();
  const mode = useWorkspaceStore((state) => state.mode);
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(access === 'signed-in' ? homeOf(mode) : '/login');
  }, [router, access, mode]);
}
