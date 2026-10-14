import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/molecules/Alert';
import { AppText } from '@/components/atoms/AppText';
import { FilterPill } from '@/components/atoms/FilterPill';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { SelectButton } from '@/components/atoms/SelectButton';
import type { FilterOption } from '@/components/molecules/FilterBar';
import { DateRangeFields } from '@/components/molecules/DateRangeFields';
import { StatCard } from '@/components/molecules/StatCard';
import type { DateRangeValue, RangeEdge } from '@/lib/date-range';

type Tone = 'neutral' | 'good' | 'warning' | 'bad';

/** Botón para ver más filas de una lista larga. */
interface MoreButton {
  readonly label: string;
  readonly busy: boolean;
  readonly onPress: () => void;
}

export interface LenderStatsViewProps {
  readonly periods: readonly FilterOption<string>[];
  /** El período rápido elegido, o `null` si manda un rango de fechas. */
  readonly period: string | null;
  readonly onPeriod: (value: string) => void;
  readonly dates: { readonly range: DateRangeValue; readonly onOpen: (edge: RangeEdge) => void; readonly onClear: () => void; readonly hint: string };
  readonly collector: { readonly label: string; readonly active: boolean; readonly onOpen: () => void };
  readonly portfolio: { readonly label: string; readonly active: boolean; readonly onOpen: () => void };
  readonly periodLabel: string;
  readonly kpis: readonly { readonly key: string; readonly label: string; readonly value: string; readonly tone: Tone; readonly trend: { readonly label: string; readonly tone: Tone } | null }[];
  readonly bucketsTitle: string;
  readonly buckets: readonly { readonly label: string; readonly amount: string; readonly clients: string; readonly percent: number }[];
  readonly topTitle: string;
  readonly top: readonly { readonly id: string; readonly name: string; readonly days: string; readonly amount: string }[];
  readonly collectorsTitle: string;
  readonly collectors: readonly { readonly id: string; readonly name: string; readonly effectiveness: string; readonly tone: Tone; readonly overdue: string }[];
  /** Botón bajo cada lista larga («Ver todos» / «Ver más»); `null` o ausente lo oculta. */
  readonly topMore?: MoreButton | null;
  readonly collectorsMore?: MoreButton | null;
  readonly empty: string | null;
  readonly exportPdf: { readonly label: string; readonly busy: boolean; readonly error: string | null; readonly onPress: () => void };
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  /** Hojas de los filtros (cobrador, cartera, calendario): van encima de todo. */
  readonly sheets: ReactNode;
}

const TONE_CLASSES = { neutral: '', good: 'text-success', warning: 'text-warning', bad: 'text-destructive' } as const;

/** Estadísticas del administrador: período, fechas, cobrador y cartera, indicadores con tendencia, mora por antigüedad, mayores morosos y desempeño por cobrador. Solo dibuja. */
export function LenderStatsView(props: Readonly<LenderStatsViewProps>) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-5" refreshControl={<RefreshControl refreshing={props.refreshing} onRefresh={props.onRefresh} />}>
        <View className="flex-row gap-2">
          {props.periods.map((option) => (
            <FilterPill key={option.value} label={option.label} active={option.value === props.period} onPress={() => { props.onPeriod(option.value); }} />
          ))}
        </View>
        <DateRangeFields range={props.dates.range} onOpen={props.dates.onOpen} onClear={props.dates.onClear} emptyHint={props.dates.hint} />
        <SelectButton label={props.collector.label} active={props.collector.active} onPress={props.collector.onOpen} />
        <SelectButton label={props.portfolio.label} active={props.portfolio.active} onPress={props.portfolio.onOpen} />
        <AppText variant="caption" tone="muted">
          {props.periodLabel}
        </AppText>
        <Button label={props.exportPdf.label} variant="outline" loading={props.exportPdf.busy} onPress={props.exportPdf.onPress} />
        {props.exportPdf.error ? <Alert message={props.exportPdf.error} /> : null}
        {props.empty ? <AppText variant="small">{props.empty}</AppText> : null}
        <View className="flex-row flex-wrap gap-3">
          {props.kpis.map((kpi) => (
            <StatCard key={kpi.key} label={kpi.label} value={kpi.value} tone={kpi.tone} trend={kpi.trend} className="min-w-[45%] flex-1" />
          ))}
        </View>
        <View className="gap-3">
          <AppText variant="title">{props.bucketsTitle}</AppText>
          <View className="gap-4 rounded-lg bg-surface p-5">
            {props.buckets.map((bucket) => (
              <View key={bucket.label} className="gap-1.5">
                <View className="flex-row justify-between">
                  <AppText variant="label">{bucket.label}</AppText>
                  <AppText variant="label">{bucket.amount}</AppText>
                </View>
                <ProgressBar tone="destructive" percent={bucket.percent} label={`${bucket.label}: ${bucket.amount}`} />
                <AppText variant="caption" tone="muted">
                  {bucket.clients}
                </AppText>
              </View>
            ))}
          </View>
        </View>
        {props.top.length > 0 ? (
          <View className="gap-3">
            <AppText variant="title">{props.topTitle}</AppText>
            <View className="overflow-hidden rounded-lg bg-surface">
              {props.top.map((entry, index) => (
                <View key={entry.id}>
                  {index > 0 ? <View className="h-px bg-surface-2" /> : null}
                  <View className="flex-row items-center justify-between gap-3 px-5 py-3">
                    <View className="flex-1">
                      <AppText variant="label" numberOfLines={1}>
                        {entry.name}
                      </AppText>
                      <AppText variant="caption" tone="muted">
                        {entry.days}
                      </AppText>
                    </View>
                    <AppText variant="label" tone="destructive">
                      {entry.amount}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
            {props.topMore ? <Button label={props.topMore.label} variant="outline" loading={props.topMore.busy} onPress={props.topMore.onPress} /> : null}
          </View>
        ) : null}
        {props.collectors.length > 0 ? (
          <View className="gap-3">
            <AppText variant="title">{props.collectorsTitle}</AppText>
            <View className="overflow-hidden rounded-lg bg-surface">
              {props.collectors.map((entry, index) => (
                <View key={entry.id}>
                  {index > 0 ? <View className="h-px bg-surface-2" /> : null}
                  <View className="flex-row items-center justify-between gap-3 px-5 py-3">
                    <View className="flex-1">
                      <AppText variant="label" numberOfLines={1}>
                        {entry.name}
                      </AppText>
                      <AppText variant="caption" tone="muted">{`Vencido ${entry.overdue}`}</AppText>
                    </View>
                    <AppText variant="label" className={TONE_CLASSES[entry.tone]}>
                      {entry.effectiveness}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
            {props.collectorsMore ? (
              <Button label={props.collectorsMore.label} variant="outline" loading={props.collectorsMore.busy} onPress={props.collectorsMore.onPress} />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      {props.sheets}
    </View>
  );
}
