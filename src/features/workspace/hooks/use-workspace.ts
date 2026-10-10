import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchLender, fetchOwnRoles } from '@/features/workspace/api/workspace-api';
import { RoleSchema, type Role } from '@/features/workspace/lib/roles';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import { applyBrandColor } from '@/lib/theme/brand';
import { z } from 'zod';

const rolesKey = (userId: string) => `fiaro.roles.${userId}`;

async function readCachedRoles(userId: string): Promise<Role[] | null> {
  try {
    const parsed = z.array(RoleSchema).safeParse(JSON.parse((await AsyncStorage.getItem(rolesKey(userId))) ?? 'null'));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Averigua los roles de la persona al iniciar sesión y deja listo el modo de la app. Sin conexión usa los
 * últimos roles guardados (un cobrador sin señal debe poder abrir su ruta) y, si nunca hubo, entra como
 * cobrador: es el rol con menos permisos, así que equivocarse hacia ese lado no expone nada. También aplica el
 * color de marca del prestamista (mejor esfuerzo: si falla se queda el de Fiaro).
 *
 * @param userId - Persona con sesión lista, o `null` mientras no la haya (limpia el estado).
 */
export function useWorkspace(userId: string | null): void {
  const loading = useWorkspaceStore((state) => state.loading);
  const loaded = useWorkspaceStore((state) => state.loaded);
  const reset = useWorkspaceStore((state) => state.reset);

  useEffect(() => {
    if (!userId) {
      reset();
      return;
    }
    let cancelled = false;
    loading();
    void (async () => {
      const result = await fetchOwnRoles(userId);
      if (cancelled) return;
      if (result.ok) {
        void AsyncStorage.setItem(rolesKey(userId), JSON.stringify(result.value));
        loaded(result.value.length > 0 ? result.value : ['COLLECTOR']);
      } else {
        signOutIfSessionExpired(result.failure);
        loaded((await readCachedRoles(userId)) ?? ['COLLECTOR']);
      }
      const lender = await fetchLender();
      if (!cancelled && lender.ok && lender.value.brandColor) applyBrandColor(lender.value.brandColor);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, loading, loaded, reset]);
}
