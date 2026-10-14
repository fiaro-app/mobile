import { RefreshControl, ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { AlertBanner } from '@/components/molecules/AlertBanner';
import { SettlementRow, type SettlementRowProps } from '@/components/molecules/SettlementRow';
import { StatCard } from '@/components/molecules/StatCard';

export interface DashboardViewProps {
  readonly kpis: readonly { readonly key: string; readonly label: string; readonly value: string; readonly tone: 'neutral' | 'good' | 'warning' | 'bad' }[];
  readonly banner: { readonly kind: 'warning' | 'error'; readonly message: string } | null;
  readonly alertsTitle: string;
  readonly alerts: readonly string[];
  readonly pendingTitle: string;
  readonly pendingEmpty: string;
  readonly pending: readonly (SettlementRowProps & { readonly id: string })[];
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
}

/** Resumen del administrador: indicadores, alertas del día y cuadres por revisar. Solo dibuja. */
export function DashboardView(props: Readonly<DashboardViewProps>) {
  return (
    <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-5" refreshControl={<RefreshControl refreshing={props.refreshing} onRefresh={props.onRefresh} />}>
      {props.banner ? <AlertBanner message={props.banner.message} kind={props.banner.kind} /> : null}
      <View className="flex-row flex-wrap gap-3">
        {props.kpis.map((kpi) => (
          <StatCard key={kpi.key} label={kpi.label} value={kpi.value} tone={kpi.tone} className="min-w-[45%] flex-1" />
        ))}
      </View>
      {props.alerts.length > 0 ? (
        <View className="gap-3">
          <AppText variant="title">{props.alertsTitle}</AppText>
          {props.alerts.map((alert) => (
            <AlertBanner key={alert} message={alert} />
          ))}
        </View>
      ) : null}
      <View className="gap-3">
        <AppText variant="title">{props.pendingTitle}</AppText>
        {props.pending.length === 0 ? (
          <AppText variant="small">{props.pendingEmpty}</AppText>
        ) : (
          <View className="overflow-hidden rounded-lg">
            {props.pending.map((row, index) => (
              <View key={row.id}>
                {index > 0 ? <View className="h-px bg-surface-2" /> : null}
                <SettlementRow {...row} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
