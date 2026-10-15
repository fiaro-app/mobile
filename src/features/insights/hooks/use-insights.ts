import { useMemo } from 'react';
import { fetchInsights } from '@/features/insights/api/insights-api';
import { buildInsightsModel, type InsightsModel } from '@/features/insights/lib/insights-view';
import type { DateRange } from '@/features/stats/lib/stats-schemas';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/**
 * «Cómo va tu negocio» del período que muestran las estadísticas. Es un complemento: si no carga, `model` queda en `null`
 * y el resto de la pantalla se muestra igual.
 */
export function useInsights(range: DateRange): { readonly model: InsightsModel | null; readonly refresh: () => void } {
  const query = useApiQuery(['admin', 'insights', range.from, range.to], () => fetchInsights(range));
  const model = useMemo(() => (query.data ? buildInsightsModel(query.data) : null), [query.data]);
  return {
    model,
    refresh: () => {
      void query.refetch();
    },
  };
}
