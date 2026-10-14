import { useMemo, useState } from 'react';
import { useStatsExport, type StatsExport } from '@/features/lender-stats/hooks/use-stats-export';
import { fetchCollectorPerformance, fetchLenderStats, fetchTopArrears } from '@/features/lender-stats/api/lender-stats-api';
import { useStatsList, type StatsList } from '@/features/lender-stats/hooks/use-stats-list';
import { buildLenderStatsModel, toCollectorRow, toTopArrearsRow, type LenderStatsModel } from '@/features/lender-stats/lib/lender-stats-view';
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
  /** Mayor mora: los 5 primeros o, al expandir, la lista completa por páginas. */
  readonly topArrears: StatsList<LenderStatsModel['topArrears'][number]>;
  /** Desempeño por cobrador: los 5 primeros o, al expandir, todos por páginas. */
  readonly collectors: StatsList<LenderStatsModel['collectors'][number]>;
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
  const collector = collectorId === ALL_COLLECTORS ? undefined : collectorId;
  const topArrears = useStatsList(['top-arrears', collectorId], model?.topArrears ?? [], (page) => fetchTopArrears(page, collector), toTopArrearsRow);
  const collectors = useStatsList(['collectors', range.from, range.to], model?.collectors ?? [], (page) => fetchCollectorPerformance(page, range), toCollectorRow);
  return {
    topArrears,
    collectors,
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
