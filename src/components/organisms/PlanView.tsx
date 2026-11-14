import { RefreshControl, ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Badge, type BadgeKind } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { AlertBanner } from '@/components/molecules/AlertBanner';
import { InfoRow } from '@/components/molecules/InfoRow';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { SettingsSection } from '@/components/molecules/SettingsSection';

export interface PlanViewProps {
  readonly texts: {
    readonly current: string; readonly offers: string; readonly offersHint: string; readonly perMonth: string;
    readonly history: string; readonly historyEmpty: string; readonly payOnWeb: string; readonly payHint: string;
  };
  readonly plan: {
    readonly rows: readonly { readonly label: string; readonly value: string }[];
    readonly bars: readonly { readonly label: string; readonly value: string; readonly percent: number }[];
    readonly notice: { readonly kind: 'warning' | 'error'; readonly message: string } | null;
  };
  /** Código del plan en curso, para marcarlo entre los que se ofrecen. */
  readonly currentCode: string | null;
  readonly offers: readonly { readonly code: string; readonly name: string; readonly price: string; readonly tagline: string; readonly features: readonly string[] }[];
  readonly payments: readonly { readonly id: string; readonly title: string; readonly subtitle: string; readonly amount: string; readonly badge: { readonly label: string; readonly kind: BadgeKind } }[];
  readonly paymentsLoading: boolean;
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly onPay: () => void;
}

/** «Plan y pagos»: el plan en curso con su uso, los planes que se ofrecen, el botón para pagar en la web y el historial de pagos. Solo dibuja. */
export function PlanView({ texts, plan, currentCode, offers, payments, paymentsLoading, refreshing, onRefresh, onPay }: Readonly<PlanViewProps>) {
  return (
    <ScrollView contentContainerClassName="gap-5 p-5 pb-10" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {plan.notice ? <AlertBanner message={plan.notice.message} kind={plan.notice.kind} /> : null}
      <SettingsSection title={texts.current}>
        <View>
          {plan.rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </View>
        {plan.bars.map((bar) => (
          <View key={bar.label} className="gap-1">
            <ProgressBar percent={bar.percent} label={`${bar.label}: ${bar.value}`} />
            <AppText variant="caption" tone="muted">{`${bar.label}: ${bar.value}`}</AppText>
          </View>
        ))}
      </SettingsSection>

      <SettingsSection title={texts.offers} hint={texts.offersHint}>
        {offers.map((offer) => (
          <View key={offer.code} className="gap-2 rounded-md border border-surface-3 p-4">
            <View className="flex-row items-center justify-between">
              <AppText variant="title">{offer.name}</AppText>
              {offer.code === currentCode ? <Badge label="TU PLAN" kind="primary" /> : null}
            </View>
            <AppText variant="body">{`${offer.price} ${texts.perMonth}`}</AppText>
            <AppText variant="caption" tone="muted">{offer.tagline}</AppText>
            {offer.features.map((feature) => (
              <AppText key={feature} variant="small">{`• ${feature}`}</AppText>
            ))}
          </View>
        ))}
        <Button label={texts.payOnWeb} onPress={onPay} />
        <AppText variant="caption" tone="muted">{texts.payHint}</AppText>
      </SettingsSection>

      <SettingsSection title={texts.history}>
        {payments.length === 0 && !paymentsLoading ? <AppText variant="small">{texts.historyEmpty}</AppText> : null}
        {payments.map((payment) => (
          <View key={payment.id} className="flex-row items-center justify-between gap-3 border-b border-surface-2 pb-3">
            <View className="flex-1 gap-0.5">
              <AppText variant="body">{payment.title}</AppText>
              <AppText variant="caption" tone="muted">{payment.subtitle}</AppText>
            </View>
            <View className="items-end gap-1">
              <AppText variant="body">{payment.amount}</AppText>
              <Badge label={payment.badge.label} kind={payment.badge.kind} />
            </View>
          </View>
        ))}
      </SettingsSection>
    </ScrollView>
  );
}
