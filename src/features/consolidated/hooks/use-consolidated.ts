import { useMemo } from 'react';
import { fetchConsolidated } from '@/features/consolidated/api/consolidated-api';
import { buildConsolidatedModel, type ConsolidatedModel } from '@/features/consolidated/lib/consolidated-view';
import type { DateRange } from '@/features/stats/lib/stats-schemas';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/**
 * «Todos tus negocios» del período de las estadísticas. Es un complemento: si no carga o la persona tiene un solo negocio,
 * `model` queda en `null` y el resto de la pantalla se muestra igual. Con `enabled` en `false` (el plan no lo trae) no pide nada.
 */
export function useConsolidated(range: DateRange, enabled: boolean): { readonly model: ConsolidatedModel | null; readonly refresh: () => void } {
  const query = useApiQuery(['admin', 'consolidated', range.from, range.to], () => fetchConsolidated(range), enabled);
  const model = useMemo(() => (query.data ? buildConsolidatedModel(query.data) : null), [query.data]);
  return {
    model,
    refresh: () => {
      if (enabled) void query.refetch();
    },
  };
}
