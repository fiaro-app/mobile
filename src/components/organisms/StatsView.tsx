import { RefreshControl, ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { FilterPill } from '@/components/atoms/FilterPill';
import type { FilterOption } from '@/components/molecules/FilterBar';
import { StatCard } from '@/components/molecules/StatCard';

export interface StatsViewProps {
  readonly periods: readonly FilterOption<string>[];
  readonly period: string;
  readonly onPeriod: (value: string) => void;
  readonly collected: { readonly label: string; readonly value: string };
  readonly comparison: string;
  readonly cards: readonly { readonly label: string; readonly value: string }[];
  readonly overdue: { readonly label: string; readonly value: string; readonly hint: string };
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
}

/**
 * Pantalla "Estadísticas": selector de período, lo cobrado con su comparativo, tarjetas de esperado /
 * efectividad / visitas y la cartera vencida en rojo. Jalar hacia abajo refresca. Solo dibuja.
 */
export function StatsView(props: Readonly<StatsViewProps>) {
  return (
    <ScrollView
      contentContainerClassName="gap-5 px-5 pb-8 pt-5"
      refreshControl={<RefreshControl refreshing={props.refreshing} onRefresh={props.onRefresh} />}
    >
      <View className="flex-row gap-2">
        {props.periods.map((option) => (
          <FilterPill
            key={option.value}
            label={option.label}
            active={option.value === props.period}
            onPress={() => {
              props.onPeriod(option.value);
            }}
          />
        ))}
      </View>
      <View className="gap-1">
        <StatCard label={props.collected.label} value={props.collected.value} />
        <AppText variant="caption" tone="muted">
          {props.comparison}
        </AppText>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {props.cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} className="min-w-[45%] flex-1" />
        ))}
      </View>
      <StatCard label={props.overdue.label} value={props.overdue.value} hint={props.overdue.hint} alert />
    </ScrollView>
  );
}
