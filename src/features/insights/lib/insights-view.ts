import type { DayBarData } from '@/components/molecules/DayBars';
import type { BarSegment } from '@/components/molecules/ProportionBar';
import type { InsightCard, InsightsSectionProps } from '@/components/organisms/InsightsSection';
import { INSIGHTS_COPY as T } from '@/features/insights/content/messages';
import type { Insights } from '@/features/insights/lib/insights-schemas';
import { relativeTrend } from '@/features/lender-stats/lib/trend';
import { formatWeekdayDay } from '@/lib/business-date';
import { formatCop, formatCopCompact } from '@/lib/format-cop';

type SegmentTone = 'primary' | 'success' | 'warning' | 'destructive';

type Segment = BarSegment;
type DayBar = DayBarData;

/** Lo que dibuja «Cómo va tu negocio»: el mismo objeto que recibe `InsightsSection`. */
export type InsightsModel = InsightsSectionProps;

const money = (id: string, label: string, value: number, tone: SegmentTone): Segment => ({ id, label, value, amount: formatCop(value), tone });
const count = (id: string, label: string, value: number, tone: SegmentTone): Segment => ({ id, label, value, amount: String(value), tone });
const percent = (ratio: number | null) => (ratio === null ? '—' : `${String(Math.round(ratio * 100))} %`);
/** `2026-10-15` → `jue 15`. */
const dayLabel = formatWeekdayDay;
const bar = (day: { date: string; collected?: number; expected: number }): DayBar => ({ date: day.date, label: dayLabel(day.date), collected: day.collected ?? 0, expected: day.expected });

function lendingCard(origination: Insights['origination']): InsightCard {
  if (origination.loansCreated === 0) return { id: 'lending', title: T.lending.title, kind: 'empty', note: T.lending.empty };
  return {
    id: 'lending',
    title: T.lending.title,
    kind: 'lines',
    lines: [
      T.lending.loans(origination.loansCreated),
      ...(origination.averageTicket === null ? [] : [T.lending.ticket(formatCop(origination.averageTicket))]),
      T.lending.interest(formatCop(origination.agreedInterest)),
    ],
  };
}

function visitsCard(data: Insights['visits']): InsightCard {
  if (data.total === 0) return { id: 'visits', title: T.visits.title, kind: 'empty', note: T.visits.empty };
  return {
    id: 'visits',
    title: T.visits.title,
    note: T.visits.summary(data.total, percent(data.contactRate), percent(data.paidRate)),
    kind: 'proportion',
    label: T.visits.title,
    segments: [count('PAID', T.visits.PAID, data.PAID, 'success'), count('RESCHEDULED', T.visits.RESCHEDULED, data.RESCHEDULED, 'primary'), count('REFUSED', T.visits.REFUSED, data.REFUSED, 'warning'), count('NOT_FOUND', T.visits.NOT_FOUND, data.NOT_FOUND, 'destructive')],
  };
}

function settlementsCard(data: Insights['settlements']): InsightCard {
  if (data.submitted === 0) return { id: 'settlements', title: T.settlements.title, kind: 'empty', note: T.settlements.empty };
  return {
    id: 'settlements',
    title: T.settlements.title,
    kind: 'lines',
    lines: [
      T.settlements.submitted(data.submitted),
      T.settlements.balanced(data.balanced),
      ...(data.withDifference > 0 ? [T.settlements.difference(data.withDifference, formatCop(data.shortfall), formatCop(data.surplus))] : []),
    ],
  };
}

function incomeCards(data: Insights): InsightCard[] {
  const paid = data.income.collected > 0;
  const income: InsightCard = paid
    ? { id: 'income', title: T.income.title, kind: 'proportion', label: T.income.title, segments: [money('principal', T.income.principal, data.income.principalRecovered, 'primary'), money('interest', T.income.interest, data.income.interest, 'success')] }
    : { id: 'income', title: T.income.title, kind: 'empty', note: T.income.empty };
  const methods: InsightCard = paid
    ? { id: 'methods', title: T.methods.title, note: T.methods.hint, kind: 'proportion', label: T.methods.title, segments: [money('CASH', T.methods.CASH, data.income.byMethod.CASH, 'warning'), money('NEQUI', T.methods.NEQUI, data.income.byMethod.NEQUI, 'primary'), money('TRANSFER', T.methods.TRANSFER, data.income.byMethod.TRANSFER, 'success')] }
    : { id: 'methods', title: T.methods.title, kind: 'empty', note: T.income.empty };
  return [income, methods];
}

/** Convierte la respuesta de la API en lo que pinta «Cómo va tu negocio». */
export function buildInsightsModel(data: Insights): InsightsModel {
  const expectedTotal = data.daily.reduce((sum, day) => sum + day.expected, 0);
  const upcoming = data.forecast.reduce((sum, day) => sum + day.expected, 0);
  const progress = expectedTotal === 0 ? null : Math.min(1, data.income.collected / expectedTotal);
  const dailySummary = progress === null ? T.daily.summaryNothingDue(formatCop(data.income.collected)) : T.daily.summary(formatCop(data.income.collected), formatCop(expectedTotal), percent(progress));
  const forecastMax = Math.max(1, ...data.forecast.map((day) => day.expected));
  const forecastTotal = T.forecast.total(formatCop(upcoming));
  return {
    title: T.title,
    kpis: [
      { key: 'collected', label: T.kpis.collected, value: formatCopCompact(data.income.collected), tone: 'neutral', trend: relativeTrend(data.income.collected, data.previous.collected, 'higher-is-better') },
      { key: 'interest', label: T.kpis.interest, value: formatCopCompact(data.income.interest), tone: 'good', trend: relativeTrend(data.income.interest, data.previous.interest, 'higher-is-better') },
      { key: 'lent', label: T.kpis.lent, value: formatCopCompact(data.origination.amountLent), tone: 'neutral', trend: relativeTrend(data.origination.amountLent, data.previous.amountLent, 'neutral') },
      { key: 'contact', label: T.kpis.contact, value: percent(data.visits.contactRate), tone: 'neutral', trend: null },
    ],
    cards: [
      { id: 'daily', title: T.daily.title, note: dailySummary, hint: T.daily.hint, kind: 'bars', bars: data.daily.map(bar), progress, label: dailySummary, legendCollected: T.daily.legendCollected, legendExpected: T.daily.legendExpected, legendReached: T.daily.reachedGoal },
      ...incomeCards(data),
      lendingCard(data.origination),
      visitsCard(data.visits),
      settlementsCard(data.settlements),
      {
        id: 'forecast',
        title: T.forecast.title,
        note: forecastTotal,
        kind: 'upcoming',
        days: data.forecast.map((day, index) => ({
          date: day.date,
          label: index === 0 ? `${T.forecast.tomorrow} · ${dayLabel(day.date)}` : dayLabel(day.date),
          amount: day.expected === 0 ? T.forecast.nothing : formatCop(day.expected),
          ratio: day.expected / forecastMax,
        })),
        label: `${T.forecast.title}. ${forecastTotal}`,
      },
    ],
  };
}
