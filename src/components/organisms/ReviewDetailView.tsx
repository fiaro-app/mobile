import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Badge, type BadgeKind } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/molecules/ConfirmDialog';
import { InfoRow } from '@/components/molecules/InfoRow';

export interface ReviewDetailViewProps {
  readonly collectorName: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
  readonly summary: string;
  readonly rows: readonly { readonly label: string; readonly value: string; readonly alert?: boolean }[];
  readonly collectorNote: { readonly title: string; readonly text: string } | null;
  readonly reviewNote: { readonly title: string; readonly text: string } | null;
  readonly error: string | null;
  readonly notice: string | null;
  readonly actions: { readonly approve: string; readonly reject: string; readonly onApprove: () => void; readonly onReject: () => void } | null;
  readonly busy: boolean;
  readonly dialog: Pick<ConfirmDialogProps, 'visible' | 'title' | 'message' | 'cancelLabel' | 'confirmLabel' | 'onCancel' | 'onConfirm' | 'destructive'>;
  readonly comment: { readonly label: string; readonly value: string; readonly onChange: (text: string) => void };
}

/** Detalle de un cuadre: cobrador y estado, cifras por medio de pago, diferencia, notas y los botones de aprobar o rechazar. Solo dibuja. */
export function ReviewDetailView(props: Readonly<ReviewDetailViewProps>) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        <View className="gap-1 rounded-lg bg-surface pb-2 pt-5">
          <View className="flex-row items-center justify-between gap-3 px-5">
            <AppText variant="title" className="flex-1" numberOfLines={1}>
              {props.collectorName}
            </AppText>
            <Badge label={props.badge.label} kind={props.badge.kind} />
          </View>
          <AppText variant="small" className="px-5 pb-2">
            {props.summary}
          </AppText>
          {props.rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} alert={row.alert} />
          ))}
        </View>
        {props.collectorNote ? (
          <View className="gap-1 rounded-lg bg-surface p-5">
            <AppText variant="label">{props.collectorNote.title}</AppText>
            <AppText variant="body">{props.collectorNote.text}</AppText>
          </View>
        ) : null}
        {props.reviewNote ? (
          <View className="gap-1 rounded-lg bg-surface p-5">
            <AppText variant="label">{props.reviewNote.title}</AppText>
            <AppText variant="body">{props.reviewNote.text}</AppText>
          </View>
        ) : null}
        {props.error ? <Alert message={props.error} /> : null}
        {props.notice ? (
          <AppText variant="small" tone="primary" accessibilityLiveRegion="polite">
            {props.notice}
          </AppText>
        ) : null}
        {props.actions ? (
          <View className="flex-row gap-3">
            <Button label={props.actions.reject} variant="danger-outline" className="flex-1" onPress={props.actions.onReject} disabled={props.busy} />
            <Button label={props.actions.approve} className="flex-1" onPress={props.actions.onApprove} disabled={props.busy} />
          </View>
        ) : null}
      </ScrollView>
      <ConfirmDialog {...props.dialog} busy={props.busy}>
        <TextField accessibilityLabel={props.comment.label} placeholder={props.comment.label} value={props.comment.value} onChangeText={props.comment.onChange} multiline maxLength={500} className="h-20 py-2" textAlignVertical="top" />
      </ConfirmDialog>
    </View>
  );
}
