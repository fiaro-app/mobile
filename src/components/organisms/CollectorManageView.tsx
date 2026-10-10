import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { SelectButton } from '@/components/atoms/SelectButton';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/molecules/ConfirmDialog';
import { SecretCard, type SecretCardProps } from '@/components/molecules/SecretCard';
import { StatCard } from '@/components/molecules/StatCard';
import { OptionSheet } from '@/components/organisms/OptionSheet';

export interface CollectorManageViewProps {
  readonly person: { readonly initials: string; readonly name: string; readonly phone: string; readonly portfolio: string; readonly active: boolean };
  readonly statusLabel: string;
  readonly inactiveNote: string;
  readonly error: string | null;
  readonly notice: string | null;
  readonly statsTitle: string;
  readonly statsPeriod: string | null;
  readonly stats: readonly { readonly key: string; readonly label: string; readonly value: string; readonly tone: 'neutral' | 'good' | 'warning' | 'bad' }[];
  readonly portfolioLabel: string;
  readonly portfolioValue: string;
  readonly portfolioChanged: boolean;
  readonly savePortfolioLabel: string;
  readonly onOpenPortfolio: () => void;
  readonly onSavePortfolio: () => void;
  readonly resetLabel: string;
  readonly deactivateLabel: string;
  readonly onReset: () => void;
  readonly onDeactivate: () => void;
  readonly busy: boolean;
  readonly secret: SecretCardProps | null;
  readonly dialog: Pick<ConfirmDialogProps, 'visible' | 'title' | 'message' | 'cancelLabel' | 'confirmLabel' | 'onCancel' | 'onConfirm' | 'destructive'>;
  readonly portfolioSheet: { readonly visible: boolean; readonly title: string; readonly options: readonly { value: string; label: string }[]; readonly selected: string; readonly onSelect: (value: string) => void; readonly onClose: () => void };
}

/** Pantalla "Gestionar cobrador": datos, desempeño del mes, cartera y las acciones (restablecer contraseña, desactivar). Solo dibuja. */
export function CollectorManageView(props: Readonly<CollectorManageViewProps>) {
  const { person } = props;
  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        <View className="flex-row items-center gap-4 rounded-lg bg-surface p-5">
          <Avatar initials={person.initials} size="xl" />
          <View className="flex-1 gap-1">
            <AppText variant="title" numberOfLines={1}>
              {person.name}
            </AppText>
            <AppText variant="mono" tone="muted">
              {person.phone}
            </AppText>
            <Badge label={props.statusLabel} kind={person.active ? 'good' : 'neutral'} />
          </View>
        </View>
        {props.error ? <Alert message={props.error} /> : null}
        {props.notice ? (
          <AppText variant="small" tone="primary" accessibilityLiveRegion="polite">
            {props.notice}
          </AppText>
        ) : null}
        {props.secret ? <SecretCard {...props.secret} /> : null}
        {person.active ? null : <AppText variant="small">{props.inactiveNote}</AppText>}
        <View className="gap-3">
          <AppText variant="title">{props.statsTitle}</AppText>
          {props.statsPeriod ? (
            <AppText variant="caption" tone="muted">
              {props.statsPeriod}
            </AppText>
          ) : null}
          <View className="flex-row flex-wrap gap-3">
            {props.stats.map((card) => (
              <StatCard key={card.key} label={card.label} value={card.value} tone={card.tone} className="min-w-[45%] flex-1" />
            ))}
          </View>
        </View>
        {person.active ? (
          <View className="gap-3">
            <AppText variant="label">{props.portfolioLabel}</AppText>
            <SelectButton label={props.portfolioValue} active onPress={props.onOpenPortfolio} />
            {props.portfolioChanged ? <Button label={props.savePortfolioLabel} loading={props.busy} onPress={props.onSavePortfolio} /> : null}
          </View>
        ) : null}
        {person.active ? (
          <View className="gap-3">
            <Button label={props.resetLabel} variant="outline" onPress={props.onReset} disabled={props.busy} />
            <Button label={props.deactivateLabel} variant="danger-outline" onPress={props.onDeactivate} disabled={props.busy} />
          </View>
        ) : null}
      </ScrollView>
      <ConfirmDialog {...props.dialog} busy={props.busy} />
      <OptionSheet {...props.portfolioSheet} />
    </View>
  );
}
