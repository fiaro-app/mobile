import { useState } from 'react';
import { usePeriodStats } from '@/features/stats/hooks/use-stats';
import { currentRange, previousRange, type Period } from '@/features/stats/lib/period-range';
import { buildStatsModel, type StatsModel } from '@/features/stats/lib/stats-view-model';
import { businessDateOf } from '@/lib/business-date';

/** Todo lo que la pantalla "Estadísticas" dibuja y puede hacer. */
export interface StatsScreen {
  readonly period: Period;
  readonly setPeriod: (period: Period) => void;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly model: StatsModel | null;
  readonly refreshing: boolean;
  readonly refresh: () => void;
}

/**
 * Lógica de "Estadísticas": el período elegido (semana, mes o año hasta hoy) y su comparativo con el período
 * anterior. El comparativo es opcional: si solo ese segundo pedido falla, se muestran las cifras igual.
 */
export function useStatsScreen(): StatsScreen {
  const [period, setPeriod] = useState<Period>('month');
  const today = businessDateOf();
  const current = usePeriodStats(currentRange(period, today));
  const previous = usePeriodStats(previousRange(period, today));
  return {
    period,
    setPeriod,
    loading: current.isPending,
    loadFailed: current.data === undefined && current.isError,
    model: current.data ? buildStatsModel(current.data, previous.data) : null,
    refreshing: current.isFetching && current.data !== undefined,
    refresh: () => {
      void current.refetch();
      void previous.refetch();
    },
  };
}
