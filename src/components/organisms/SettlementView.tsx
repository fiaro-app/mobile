import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { AmountRow } from '@/components/molecules/AmountRow';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/molecules/ConfirmDialog';
import { FormField } from '@/components/molecules/FormField';
import { InfoRow } from '@/components/molecules/InfoRow';
import { ReviewNotice, type ReviewNoticeProps } from '@/components/molecules/ReviewNotice';

export interface SettlementViewProps {
  readonly expectedTitle: string;
  readonly expectedLabel: string;
  readonly collectedTitle: string;
  readonly collectedLabel: string;
  readonly differenceText: string;
  readonly notice: ReviewNoticeProps | null;
  readonly methodsTitle: string;
  readonly amounts: readonly { readonly key: string; readonly label: string; readonly value: string; readonly onChange: (text: string) => void }[];
  readonly noteLabel: string;
  readonly notePlaceholder: string;
  readonly note: string;
  readonly noteError: string | null;
  readonly onNote: (text: string) => void;
  readonly locked: boolean;
  readonly formError: string | null;
  readonly submitLabel: string;
  readonly submitting: boolean;
  readonly onSubmit: () => void;
  readonly confirm: Pick<ConfirmDialogProps, 'visible' | 'title' | 'message' | 'cancelLabel' | 'confirmLabel' | 'onCancel' | 'onConfirm'>;
}

/**
 * Pantalla "Cuadre del día": lo esperado y lo cobrado arriba, el aviso del estado si ya se envió, los montos
 * por medio de pago, la nota y el botón de enviar. Con `locked` todo queda de solo lectura. Solo dibuja: la
 * lógica llega de `useSettlementScreen`.
 */
export function SettlementView(props: Readonly<SettlementViewProps>) {
  return (
    <View className="flex-1">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        {props.notice ? <ReviewNotice {...props.notice} /> : null}
        <View className="overflow-hidden rounded-md border border-foreground/10 bg-surface py-1">
          <InfoRow label={props.expectedTitle} value={props.expectedLabel} />
          <InfoRow label={props.collectedTitle} value={props.collectedLabel} />
          <InfoRow label="Diferencia" value={props.differenceText} />
        </View>
        <View className="gap-3">
          <AppText variant="label">{props.methodsTitle}</AppText>
          {props.amounts.map((row) => (
            <AmountRow key={row.key} label={row.label} value={row.value} onChangeText={row.onChange} editable={!props.locked && !props.submitting} />
          ))}
        </View>
        <FormField label={props.noteLabel} error={props.noteError}>
          {(accessibility) => (
            <TextField
              {...accessibility}
              value={props.note}
              onChangeText={props.onNote}
              placeholder={props.notePlaceholder}
              invalid={props.noteError !== null}
              editable={!props.locked && !props.submitting}
              multiline
              maxLength={500}
              textAlignVertical="top"
              className="h-24 py-3"
            />
          )}
        </FormField>
        {props.formError ? <Alert message={props.formError} /> : null}
        {props.locked ? null : <Button label={props.submitLabel} loading={props.submitting} onPress={props.onSubmit} />}
      </ScrollView>
      <ConfirmDialog {...props.confirm} />
    </View>
  );
}
