import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { SelectButton } from '@/components/atoms/SelectButton';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { RiskCard, type RiskCardProps } from '@/components/molecules/RiskCard';
import { FormField } from '@/components/molecules/FormField';
import { DatePickerSheet } from '@/components/organisms/DatePickerSheet';
import { OptionSheet } from '@/components/organisms/OptionSheet';

type Option = { readonly value: string; readonly label: string; readonly description?: string };

export interface LoanFormViewProps {
  readonly values: { readonly principal: string; readonly count: string; readonly installment: string; readonly total: string; readonly frequency: string; readonly startDate: string; readonly collectorId: string };
  readonly errors: Partial<Record<'clientId' | 'principal' | 'count' | 'installment' | 'total' | 'frequency' | 'startDate', string>>;
  readonly labels: { readonly client: string; readonly frequency: string; readonly startDate: string; readonly collector: string };
  readonly texts: { readonly clientField: string; readonly principal: string; readonly count: string; readonly installment: string; readonly total: string; readonly totalHint: string; readonly frequency: string; readonly startDate: string; readonly collector: string; readonly submit: string; readonly cancel: string; readonly seeLoan: string };
  readonly totalSuggested: boolean;
  /** Aviso de riesgo muy alto del cliente elegido; no bloquea el envío. */
  readonly riskWarning?: string | null;
  /** Tarjeta de riesgo del cliente elegido, bajo el formulario. */
  readonly risk?: RiskCardProps | null;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly createdLoanId: string | null;
  readonly sheets: { readonly active: 'none' | 'client' | 'frequency' | 'startDate' | 'collector'; readonly frequency: readonly Option[]; readonly today: string; readonly collector: readonly Option[]; readonly onClose: () => void };
  readonly onOpen: (sheet: 'client' | 'frequency' | 'startDate' | 'collector') => void;
  readonly onAmount: (field: 'principal' | 'installment' | 'total', text: string) => void;
  readonly onCount: (text: string) => void;
  readonly onFrequency: (value: string) => void;
  readonly onStartDate: (value: string) => void;
  readonly onCollector: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly onSeeLoan: () => void;
}

/** Formulario "Nuevo préstamo": cliente, montos, cuotas, frecuencia, fecha de inicio y cobrador opcional. Solo dibuja. */
export function LoanFormView(props: Readonly<LoanFormViewProps>) {
  const { values, errors, texts, labels } = props;
  const editable = !props.submitting && props.createdLoanId === null;
  const money = (field: 'principal' | 'installment' | 'total', label: string, hint?: string) => (
    <FormField label={label} error={errors[field]} hint={hint}>
      {(a11y) => <TextField {...a11y} value={values[field]} onChangeText={(text) => { props.onAmount(field, text); }} invalid={Boolean(errors[field])} keyboardType="number-pad" placeholder="$ 0" editable={editable} />}
    </FormField>
  );
  return (
    <View className="flex-1">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        <View className="gap-5 rounded-lg bg-surface p-5">
          {props.formError ? <Alert message={props.formError} /> : null}
          <FormField label={texts.clientField} error={errors.clientId}>
            {() => <SelectButton label={labels.client} active={!errors.clientId} onPress={() => { props.onOpen('client'); }} />}
          </FormField>
          {props.riskWarning ? <Alert message={props.riskWarning} /> : null}
          {money('principal', texts.principal)}
          <FormField label={texts.count} error={errors.count}>
            {(a11y) => <TextField {...a11y} value={values.count} onChangeText={props.onCount} invalid={Boolean(errors.count)} keyboardType="number-pad" placeholder="30" editable={editable} />}
          </FormField>
          {money('installment', texts.installment)}
          {money('total', texts.total, props.totalSuggested ? texts.totalHint : undefined)}
          <FormField label={texts.frequency} error={errors.frequency}>
            {() => <SelectButton label={labels.frequency} active={values.frequency !== ''} onPress={() => { props.onOpen('frequency'); }} />}
          </FormField>
          <FormField label={texts.startDate} error={errors.startDate}>
            {() => <SelectButton label={labels.startDate} active onPress={() => { props.onOpen('startDate'); }} />}
          </FormField>
          <FormField label={texts.collector}>{() => <SelectButton label={labels.collector} active={values.collectorId !== ''} onPress={() => { props.onOpen('collector'); }} />}</FormField>
        </View>
        {props.risk ? <RiskCard {...props.risk} /> : null}
        {props.createdLoanId ? (
          <Button label={texts.seeLoan} onPress={props.onSeeLoan} />
        ) : (
          <View className="flex-row gap-3">
            <Button label={texts.cancel} variant="outline" className="flex-1" onPress={props.onCancel} disabled={props.submitting} />
            <Button label={texts.submit} className="flex-[1.6]" onPress={props.onSubmit} loading={props.submitting} />
          </View>
        )}
        <AppText variant="caption" tone="muted">
          El saldo y la mora los calcula el sistema a partir de estas condiciones.
        </AppText>
      </ScrollView>
      <OptionSheet visible={props.sheets.active === 'frequency'} title={texts.frequency} options={props.sheets.frequency} selected={values.frequency} onSelect={props.onFrequency} onClose={props.sheets.onClose} />
      <DatePickerSheet visible={props.sheets.active === 'startDate'} title={texts.startDate} value={values.startDate} today={props.sheets.today} onSelect={props.onStartDate} onClose={props.sheets.onClose} />
      <OptionSheet visible={props.sheets.active === 'collector'} title={texts.collector} options={props.sheets.collector} selected={values.collectorId} onSelect={props.onCollector} onClose={props.sheets.onClose} />
    </View>
  );
}
