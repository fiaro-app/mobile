import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Estado y acción de un guardado: ocupado, error y aviso de éxito. */
export interface SaveAction {
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  /** Limpia el error y el aviso (al volver a editar). */
  readonly clear: () => void;
  /**
   * Ejecuta el guardado: si falla, traduce el error (y cierra la sesión si venció); si sale bien, avisa, invalida las
   * consultas indicadas y devuelve el valor (`undefined` si falló).
   */
  readonly run: <T>(action: () => Promise<Result<T, ApiFailure>>, success: string, invalidate?: readonly QueryKey[]) => Promise<T | undefined>;
}

/**
 * El patrón repetido de cada "Guardar": marcar ocupado, llamar al servicio, traducir el fallo con `describe`, avisar el éxito y
 * refrescar lo que cambió. Cada sección de Configuración usa su propia instancia para que sus avisos no se mezclen.
 *
 * @param describe - Traduce un fallo del API a un mensaje para la persona.
 */
export function useSaveAction(describe: (failure: ApiFailure) => string): SaveAction {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return {
    busy,
    error,
    notice,
    clear: () => {
      setError(null);
      setNotice(null);
    },
    run: async (action, success, invalidate = []) => {
      setBusy(true);
      setError(null);
      setNotice(null);
      const result = await action();
      setBusy(false);
      if (!result.ok) {
        signOutIfSessionExpired(result.failure);
        setError(describe(result.failure));
        return undefined;
      }
      setNotice(success);
      for (const key of invalidate) void queryClient.invalidateQueries({ queryKey: key });
      return result.value;
    },
  };
}
