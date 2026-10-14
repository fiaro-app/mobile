import { useMemo, useState } from 'react';
import { useStatsExport, type StatsExport } from '@/features/lender-stats/hooks/use-stats-export';
import { fetchLenderStats } from '@/features/lender-stats/api/lender-stats-api';
import { buildLenderStatsModel, type LenderStatsModel } from '@/features/lender-stats/lib/lender-stats-view';
import { currentRange, type Period } from '@/features/stats/lib/period-range';
import { useMembers } from '@/features/team/hooks/use-members';
import { businessDateOf } from '@/lib/business-date';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/** Todo lo que las estadísticas del administrador dibujan y pueden hacer. */
export interface LenderStatsScreen {
  readonly period: Period;
  readonly collectorId: string;
  readonly collectorLabel: string;
  readonly collectorOptions: readonly { value: string; label: string }[];
  readonly sheetOpen: boolean;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly model: LenderStatsModel | null;
  readonly setPeriod: (period: Period) => void;
  readonly setCollector: (id: string) => void;
  readonly openSheet: () => void;
  readonly closeSheet: () => void;
  readonly pdf: StatsExport;
  readonly refresh: () => void;
}

/** Valor del selector que significa "todos los cobradores". */
export const ALL_COLLECTORS = '';

/**
 * Lógica de las estadísticas del administrador: período (semana, mes o año hasta hoy), cobrador opcional y las tendencias contra el
 * período anterior (las calcula el API con `includePrevious`).
 */
export function useLenderStatsScreen(): LenderStatsScreen {
  const [period, setPeriod] = useState<Period>('month');
  const [collectorId, setCollectorId] = useState(ALL_COLLECTORS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const range = currentRange(period, businessDateOf());
  const members = useMembers();
  const query = useApiQuery(['admin', 'lender-stats', range.from, range.to, collectorId], () => fetchLenderStats(range, collectorId === ALL_COLLECTORS ? undefined : collectorId));
  const options = useMemo(
    () => [{ value: ALL_COLLECTORS, label: 'Todos los cobradores' }, ...(members.data ?? []).filter((member) => member.roles.includes('COLLECTOR')).map((member) => ({ value: member.id, label: member.fullName }))],
    [members.data],
  );
  const pdf = useStatsExport(range, collectorId);
  const model = useMemo(() => (query.data ? buildLenderStatsModel(query.data) : null), [query.data]);
  return {
    period,
    collectorId,
    collectorLabel: options.find((option) => option.value === collectorId)?.label ?? 'Todos los cobradores',
    collectorOptions: options,
    sheetOpen,
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    refreshing: query.isRefetching,
    model,
    pdf,
    setPeriod,
    setCollector: (id) => {
      setCollectorId(id);
      setSheetOpen(false);
    },
    openSheet: () => {
      setSheetOpen(true);
    },
    closeSheet: () => {
      setSheetOpen(false);
    },
    refresh: () => {
      void query.refetch();
    },
  };
}
