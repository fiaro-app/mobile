import { useMemo, useState } from 'react';
import { useStatsExport, type StatsExport } from '@/features/lender-stats/hooks/use-stats-export';
import { fetchCollectorPerformance, fetchLenderStats, fetchTopArrears } from '@/features/lender-stats/api/lender-stats-api';
import { useStatsList, type StatsList } from '@/features/lender-stats/hooks/use-stats-list';
import { buildLenderStatsModel, toCollectorRow, toTopArrearsRow, type LenderStatsModel } from '@/features/lender-stats/lib/lender-stats-view';
import { currentRange, type Period } from '@/features/stats/lib/period-range';
import { usePortfolios } from '@/features/collectors/hooks/use-portfolios';
import { useMembers } from '@/features/team/hooks/use-members';
import { businessDateOf } from '@/lib/business-date';
import { DATE_RANGE_LIMITS } from '@/lib/date-range';
import { useApiQuery } from '@/lib/hooks/use-api-query';
import { useDateRange, type DateRangeFilter } from '@/lib/hooks/use-date-range';

/** Todo lo que las estadísticas del administrador dibujan y pueden hacer. */
export interface LenderStatsScreen {
  /** El período rápido elegido, o `null` si manda un rango de fechas. */
  readonly period: Period | null;
  readonly dates: DateRangeFilter;
  readonly portfolio: {
    readonly id: string;
    readonly label: string;
    readonly options: readonly { value: string; label: string }[];
    readonly open: boolean;
    readonly openSheet: () => void;
    readonly closeSheet: () => void;
    readonly select: (id: string) => void;
  };
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

/** Valor del selector que significa "todas las carteras". */
export const ALL_PORTFOLIOS = '';

/**
 * Lógica de las estadísticas del administrador: período rápido (semana, mes o año hasta hoy) o un rango de fechas de hasta
 * 366 días, cobrador y cartera opcionales, y las tendencias contra el período anterior (las calcula el API con
 * `includePrevious`). Elegir fechas reemplaza el período rápido; tocar un período rápido borra las fechas.
 */
export function useLenderStatsScreen(): LenderStatsScreen {
  const [preset, setPreset] = useState<Period>('month');
  const [collectorId, setCollectorId] = useState(ALL_COLLECTORS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [portfolioId, setPortfolioId] = useState(ALL_PORTFOLIOS);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const dates = useDateRange(DATE_RANGE_LIMITS.history);
  const range = dates.applied ?? currentRange(preset, businessDateOf());
  const members = useMembers();
  const portfolios = usePortfolios();
  const portfolio = portfolioId === ALL_PORTFOLIOS ? undefined : portfolioId;
  const query = useApiQuery(['admin', 'lender-stats', range.from, range.to, collectorId, portfolioId], () =>
    fetchLenderStats(range, collectorId === ALL_COLLECTORS ? undefined : collectorId, portfolio),
  );
  const portfolioOptions = useMemo(
    () => [{ value: ALL_PORTFOLIOS, label: 'Todas las carteras' }, ...(portfolios.data ?? []).map((entry) => ({ value: entry.id, label: entry.name }))],
    [portfolios.data],
  );
  const options = useMemo(
    () => [{ value: ALL_COLLECTORS, label: 'Todos los cobradores' }, ...(members.data ?? []).filter((member) => member.roles.includes('COLLECTOR')).map((member) => ({ value: member.id, label: member.fullName }))],
    [members.data],
  );
  const pdf = useStatsExport(range, collectorId, portfolioId);
  const model = useMemo(() => (query.data ? buildLenderStatsModel(query.data) : null), [query.data]);
  const collector = collectorId === ALL_COLLECTORS ? undefined : collectorId;
  const topArrears = useStatsList(['top-arrears', collectorId, portfolioId], model?.topArrears ?? [], (page) => fetchTopArrears(page, collector, portfolio), toTopArrearsRow);
  const collectors = useStatsList(['collectors', range.from, range.to, portfolioId], model?.collectors ?? [], (page) => fetchCollectorPerformance(page, range, portfolio), toCollectorRow);
  return {
    topArrears,
    collectors,
    period: dates.applied ? null : preset,
    dates,
    portfolio: {
      id: portfolioId,
      label: portfolioOptions.find((option) => option.value === portfolioId)?.label ?? 'Todas las carteras',
      options: portfolioOptions,
      open: portfolioOpen,
      openSheet: () => {
        setPortfolioOpen(true);
      },
      closeSheet: () => {
        setPortfolioOpen(false);
      },
      select: (id) => {
        setPortfolioId(id);
        setPortfolioOpen(false);
      },
    },
    collectorId,
    collectorLabel: options.find((option) => option.value === collectorId)?.label ?? 'Todos los cobradores',
    collectorOptions: options,
    sheetOpen,
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    refreshing: query.isRefetching,
    model,
    pdf,
    setPeriod: (value) => {
      setPreset(value);
      dates.clear();
    },
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
