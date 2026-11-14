import { useState } from 'react';
import { DEFAULT_STATS_FILENAME, exportStatsPdf } from '@/features/lender-stats/api/lender-stats-api';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import type { DateRange } from '@/features/stats/lib/stats-schemas';
import { shareFile } from '@/lib/files/share-file';

/** Exportar las estadísticas a PDF. */
export interface StatsExport {
  readonly busy: boolean;
  readonly error: string | null;
  readonly start: () => void;
}

/**
 * Descarga el PDF de las estadísticas con los filtros actuales y abre la hoja de compartir (guardar o enviar). Los fallos se
 * explican en un mensaje; un 401 cierra la sesión local.
 */
export function useStatsExport(range: DateRange, collectorId: string, portfolioId = ''): StatsExport {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return {
    busy,
    error,
    start: () => {
      if (busy) return;
      void (async () => {
        setBusy(true);
        setError(null);
        const result = await exportStatsPdf(range, collectorId === '' ? undefined : collectorId, portfolioId === '' ? undefined : portfolioId);
        if (!result.ok) {
          setBusy(false);
          signOutIfSessionExpired(result.failure);
          setError(result.failure.kind === 'offline' ? 'Sin conexión. Intenta de nuevo cuando tengas internet.' : 'No pudimos generar el PDF. Intenta de nuevo.');
          return;
        }
        const shared = await shareFile(result.value.bytes, result.value.filename ?? DEFAULT_STATS_FILENAME, 'application/pdf');
        setBusy(false);
        if (shared === 'unavailable') setError('Este dispositivo no puede compartir archivos.');
        else if (shared === 'failed') setError('No pudimos guardar el PDF. Intenta de nuevo.');
      })();
    },
  };
}
