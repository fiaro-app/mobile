import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Badge, type BadgeKind } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/molecules/ConfirmDialog';
import { InfoRow } from '@/components/molecules/InfoRow';
import { MenuRow } from '@/components/molecules/MenuRow';
import { OptionSheet } from '@/components/organisms/OptionSheet';

export interface LoanDetailViewProps {
  readonly clientName: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
  readonly balanceLabel: string;
  readonly balance: string;
  readonly percent: number;
  readonly progress: string;
  readonly rows: readonly { readonly label: string; readonly value: string; readonly alert?: boolean }[];
  readonly collectorLabel: string;
  readonly collectorValue: string;
  readonly assignLabel: string;
  readonly onAssign: () => void;
  readonly links: readonly { readonly key: string; readonly icon: 'calendar-outline' | 'receipt-outline' | 'person-outline'; readonly label: string; readonly onPress: () => void }[];
  readonly error: string | null;
  readonly notice: string | null;
  readonly cancel: { readonly note: string; readonly label: string; readonly onPress: () => void } | null;
  readonly busy: boolean;
  readonly dialog: Pick<ConfirmDialogProps, 'visible' | 'title' | 'message' | 'cancelLabel' | 'confirmLabel' | 'onCancel' | 'onConfirm' | 'destructive'>;
  readonly assignSheet: { readonly visible: boolean; readonly title: string; readonly options: readonly { value: string; label: string }[]; readonly onSelect: (value: string) => void; readonly onClose: () => void };
}

/** Detalle de un préstamo: cliente y estado, saldo con progreso, datos, cobrador, accesos (calendario, historial, ficha) y anular. Solo dibuja. */
export function LoanDetailView(props: Readonly<LoanDetailViewProps>) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        <View className="gap-3 rounded-lg bg-surface pb-2 pt-5">
          <View className="flex-row items-center justify-between gap-3 px-5">
            <AppText variant="title" className="flex-1" numberOfLines={1}>
              {props.clientName}
            </AppText>
            <Badge label={props.badge.label} kind={props.badge.kind} />
          </View>
          <View className="gap-1 px-5">
            <AppText variant="caption" tone="muted">
              {props.balanceLabel}
            </AppText>
            <AppText variant="title" className="text-[30px] leading-[38px]">
              {props.balance}
            </AppText>
          </View>
          <View className="gap-1.5 px-5 pb-2">
            <ProgressBar percent={props.percent} label={props.progress} />
            <AppText variant="caption" tone="muted">
              {props.progress}
            </AppText>
          </View>
          {props.rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} alert={row.alert} />
          ))}
          <InfoRow label={props.collectorLabel} value={props.collectorValue} />
        </View>
        {props.error ? <Alert message={props.error} /> : null}
        {props.notice ? (
          <AppText variant="small" tone="primary" accessibilityLiveRegion="polite">
            {props.notice}
          </AppText>
        ) : null}
        <Button label={props.assignLabel} variant="outline" onPress={props.onAssign} disabled={props.busy} />
        <View className="overflow-hidden rounded-lg">
          {props.links.map((link) => (
            <MenuRow key={link.key} icon={link.icon} label={link.label} onPress={link.onPress} />
          ))}
        </View>
        {props.cancel ? (
          <View className="gap-3">
            <AppText variant="caption" tone="muted">
              {props.cancel.note}
            </AppText>
            <Button label={props.cancel.label} variant="danger-outline" onPress={props.cancel.onPress} disabled={props.busy} />
          </View>
        ) : null}
      </ScrollView>
      <ConfirmDialog {...props.dialog} busy={props.busy} />
      <OptionSheet visible={props.assignSheet.visible} title={props.assignSheet.title} options={props.assignSheet.options} selected="" onSelect={props.assignSheet.onSelect} onClose={props.assignSheet.onClose} />
    </View>
  );
}
