import { effectivenessTone, type Tone } from '@/features/dashboard/lib/dashboard-view-model';
import type { CollectorPerformance, LenderStats, TopArrearsEntry } from '@/features/lender-stats/lib/lender-stats-schemas';
import { pointsTrend, relativeTrend, type Trend } from '@/features/lender-stats/lib/trend';
import { formatShortDate } from '@/lib/business-date';
import { formatCop, formatCopCompact, formatPercent } from '@/lib/format-cop';

/** % en mora desde el que es aviso (ámbar) y malo (rojo). Igual que la web. */
export const ARREARS_RATE_WARNING_FROM = 0.1;
export const ARREARS_RATE_BAD_FROM = 0.2;

const BUCKET_LABELS = { '0-7': '0–7 días', '8-15': '8–15 días', '16-30': '16–30 días', '30+': 'Más de 30 días' } as const;

function arrearsRateTone(rate: number | null): Tone {
  if (rate === null) return 'neutral';
  if (rate >= ARREARS_RATE_BAD_FROM) return 'bad';
  return rate >= ARREARS_RATE_WARNING_FROM ? 'warning' : 'good';
}

function plural(count: number, singular: string, many: string): string {
  return `${String(count)} ${count === 1 ? singular : many}`;
}

/** Todo lo que las estadísticas del administrador dibujan. */
export interface LenderStatsModel {
  readonly period: string;
  readonly kpis: readonly { readonly key: string; readonly label: string; readonly value: string; readonly tone: Tone; readonly trend: Trend | null }[];
  readonly buckets: readonly { readonly label: string; readonly amount: string; readonly clients: string; readonly percent: number }[];
  readonly topArrears: readonly { readonly id: string; readonly name: string; readonly days: string; readonly amount: string }[];
  readonly collectors: readonly { readonly id: string; readonly name: string; readonly effectiveness: string; readonly tone: Tone; readonly overdue: string }[];
  readonly isEmpty: boolean;
}

/** Convierte las estadísticas del API (con el período anterior) en cifras, tonos y tendencias. Los umbrales son los de la web. */
/** Una fila del ranking de mayor mora. */
export function toTopArrearsRow(entry: TopArrearsEntry): LenderStatsModel['topArrears'][number] {
  return { id: entry.clientId, name: entry.clientFullName, days: `${plural(entry.overdueDays, 'día', 'días')} en mora`, amount: formatCop(entry.overdueAmount) };
}

/** Una fila del desempeño por cobrador. */
export function toCollectorRow(collector: CollectorPerformance): LenderStatsModel['collectors'][number] {
  return {
    id: collector.collectorMembershipId,
    name: collector.fullName,
    effectiveness: formatPercent(collector.effectiveness),
    tone: effectivenessTone(collector.effectiveness),
    overdue: formatCop(collector.overdueAmount),
  };
}

export function buildLenderStatsModel(stats: LenderStats): LenderStatsModel {
  const previous = stats.previous;
  const largest = Math.max(0, ...stats.arrearsByAge.map((bucket) => bucket.amount));
  return {
    period: `${formatShortDate(stats.from)} – ${formatShortDate(stats.to)}`,
    kpis: [
      { key: 'portfolio', label: 'Cartera total', value: formatCopCompact(stats.totalPortfolio), tone: 'neutral', trend: relativeTrend(stats.totalPortfolio, previous?.totalPortfolio, 'neutral') },
      { key: 'atRisk', label: 'Cartera en riesgo', value: formatCopCompact(stats.portfolioAtRisk), tone: stats.portfolioAtRisk > 0 ? 'bad' : 'neutral', trend: relativeTrend(stats.portfolioAtRisk, previous?.portfolioAtRisk, 'lower-is-better') },
      { key: 'arrearsRate', label: '% en mora', value: formatPercent(stats.arrearsRate), tone: arrearsRateTone(stats.arrearsRate), trend: pointsTrend(stats.arrearsRate, previous?.arrearsRate, 'lower-is-better') },
      { key: 'collected', label: 'Cobrado en el período', value: formatCopCompact(stats.collectedAmount), tone: 'good', trend: relativeTrend(stats.collectedAmount, previous?.collectedAmount, 'higher-is-better') },
      { key: 'effectiveness', label: 'Efectividad', value: formatPercent(stats.effectiveness), tone: effectivenessTone(stats.effectiveness), trend: pointsTrend(stats.effectiveness, previous?.effectiveness, 'higher-is-better') },
    ],
    buckets: stats.arrearsByAge.map((bucket) => ({
      label: BUCKET_LABELS[bucket.label],
      amount: formatCop(bucket.amount),
      clients: plural(bucket.clientsCount, 'cliente', 'clientes'),
      percent: largest === 0 ? 0 : Math.round((bucket.amount / largest) * 100),
    })),
    topArrears: stats.topArrears.map(toTopArrearsRow),
    collectors: stats.collectorPerformance.map(toCollectorRow),
    isEmpty: stats.totalPortfolio === 0 && stats.collectorPerformance.length === 0,
  };
}
