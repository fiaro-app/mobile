import { ScrollView, View } from 'react-native';
import { AmountField } from '@/components/atoms/AmountField';
import { AppText } from '@/components/atoms/AppText';
import { FilterPill } from '@/components/atoms/FilterPill';
import { StatusChip, type ChipKind } from '@/components/atoms/StatusChip';
import { TextLink } from '@/components/atoms/TextLink';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/molecules/ConfirmDialog';
import { ConfirmSlider } from '@/components/molecules/ConfirmSlider';
import type { FilterOption } from '@/components/molecules/FilterBar';
import { OptionSheet } from '@/components/organisms/OptionSheet';
import { RescheduleSheet, type RescheduleSheetProps } from '@/components/organisms/RescheduleSheet';

export interface RegisterVisitViewProps {
  readonly status: ChipKind;
  readonly summary: string;
  readonly amountLabel: string;
  readonly amountHint: string;
  readonly amountText: string;
  readonly amountError: string | null;
  readonly onAmount: (text: string) => void;
  readonly methodTitle: string;
  readonly methods: readonly FilterOption<string>[];
  readonly method: string;
  readonly onMethod: (value: string) => void;
  readonly slideLabel: string;
  readonly submitting: boolean;
  readonly onSlideConfirm: () => void;
  readonly otherLabel: string;
  readonly onOther: () => void;
  readonly formError: string | null;
  readonly confirm: Pick<ConfirmDialogProps, 'visible' | 'title' | 'message' | 'cancelLabel' | 'confirmLabel' | 'onCancel' | 'onConfirm'>;
  readonly outcomeSheet: { readonly visible: boolean; readonly title: string; readonly options: readonly FilterOption<string>[]; readonly onChoose: (value: string) => void; readonly onClose: () => void };
  readonly reschedule: RescheduleSheetProps;
}

/**
 * Pantalla "Registrar visita": estado y saldo del cliente, monto editable, medio de pago y el deslizador que
 * confirma. "Otro resultado" abre las salidas sin pago. Las capas (confirmación y hojas) son parte de la
 * misma vista para cubrir la pantalla completa. Solo dibuja: toda la lógica llega de `useRegisterVisit`.
 */
export function RegisterVisitView(props: Readonly<RegisterVisitViewProps>) {
  return (
    <View className="flex-1">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        <View className="gap-3">
          <View className="flex-row">
            <StatusChip kind={props.status} />
          </View>
          <AppText variant="small">{props.summary}</AppText>
        </View>
        <AmountField
          label={props.amountLabel}
          hint={props.amountHint}
          error={props.amountError}
          value={props.amountText}
          onChangeText={props.onAmount}
          editable={!props.submitting}
        />
        <View className="gap-3">
          <AppText variant="label">{props.methodTitle}</AppText>
          <View className="flex-row gap-2.5">
            {props.methods.map((option) => (
              <FilterPill
                key={option.value}
                size="md"
                label={option.label}
                active={option.value === props.method}
                onPress={() => {
                  props.onMethod(option.value);
                }}
              />
            ))}
          </View>
        </View>
        {props.formError ? <Alert message={props.formError} /> : null}
        <ConfirmSlider label={props.slideLabel} onConfirm={props.onSlideConfirm} disabled={props.submitting} />
        <View className="items-center">
          <TextLink label={props.otherLabel} onPress={props.onOther} />
        </View>
      </ScrollView>
      <ConfirmDialog {...props.confirm} />
      <OptionSheet
        visible={props.outcomeSheet.visible}
        title={props.outcomeSheet.title}
        options={props.outcomeSheet.options}
        selected=""
        onSelect={props.outcomeSheet.onChoose}
        onClose={props.outcomeSheet.onClose}
      />
      <RescheduleSheet {...props.reschedule} />
    </View>
  );
}
