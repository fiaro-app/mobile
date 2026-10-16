import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { SelectButton } from '@/components/atoms/SelectButton';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { FormField } from '@/components/molecules/FormField';
import { DatePickerSheet } from '@/components/organisms/DatePickerSheet';
import { OptionSheet } from '@/components/organisms/OptionSheet';
type Option = { readonly value: string; readonly label: string; readonly description?: string };

type RequestField = 'nationalId' | 'fullName' | 'phone' | 'occupation' | 'address' | 'principal' | 'count' | 'installment' | 'total' | 'frequency' | 'startDate';

export interface LoanRequestFormViewProps {
  readonly values: { readonly nationalId: string; readonly fullName: string; readonly phone: string; readonly occupation: string; readonly address: string; readonly principal: string; readonly count: string; readonly installment: string; readonly total: string; readonly frequency: string; readonly startDate: string };
  readonly errors: Partial<Record<RequestField, string>>;
  /** `exists`: la cédula ya es del negocio; `new`: hay que registrar al cliente. */
  readonly lookup: 'idle' | 'checking' | 'exists' | 'new';
  readonly labels: { readonly frequency: string; readonly startDate: string };
  readonly texts: {
    readonly intro: string;
    readonly nationalId: string;
    readonly nationalIdPlaceholder: string;
    readonly search: string;
    readonly searching: string;
    readonly existing: string;
    readonly unknown: string;
    readonly clientSection: string;
    readonly name: string;
    readonly namePlaceholder: string;
    readonly phone: string;
    readonly phonePlaceholder: string;
    readonly occupation: string;
    readonly occupationPlaceholder: string;
    readonly address: string;
    readonly addressPlaceholder: string;
    readonly loanSection: string;
    readonly principal: string;
    readonly count: string;
    readonly installment: string;
    readonly total: string;
    readonly totalHint: string;
    readonly frequency: string;
    readonly startDate: string;
    readonly submit: string;
    readonly cancel: string;
    readonly hint: string;
  };
  readonly totalSuggested: boolean;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly sheets: { readonly active: 'none' | 'frequency' | 'startDate'; readonly frequency: readonly Option[]; readonly today: string; readonly onClose: () => void };
  readonly onNationalId: (text: string) => void;
  readonly onSearch: () => void;
  readonly onText: (field: 'fullName' | 'occupation' | 'address', text: string) => void;
  readonly onPhone: (text: string) => void;
  readonly onAmount: (field: 'principal' | 'installment' | 'total', text: string) => void;
  readonly onCount: (text: string) => void;
  readonly onOpen: (sheet: 'frequency' | 'startDate') => void;
  readonly onFrequency: (value: string) => void;
  readonly onStartDate: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

/**
 * Formulario "Sugerir un préstamo" del cobrador: cédula con su consulta, los datos del cliente solo si es nuevo y las
 * condiciones del préstamo. No muestra el riesgo ni datos de clientes del negocio. Solo dibuja.
 */
export function LoanRequestFormView(props: Readonly<LoanRequestFormViewProps>) {
  const { values, errors, texts, lookup } = props;
  const editable = !props.submitting;
  const known = lookup === 'exists' || lookup === 'new';
  const money = (field: 'principal' | 'installment' | 'total', label: string, hint?: string) => (
    <FormField label={label} error={errors[field]} hint={hint}>
      {(a11y) => <TextField {...a11y} value={values[field]} onChangeText={(text) => { props.onAmount(field, text); }} invalid={Boolean(errors[field])} keyboardType="number-pad" placeholder="$ 0" editable={editable} />}
    </FormField>
  );
  return (
    <View className="flex-1">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
        <AppText variant="small">{texts.intro}</AppText>
        <View className="gap-5 rounded-lg bg-surface p-5">
          {props.formError ? <Alert message={props.formError} /> : null}
          <FormField label={texts.nationalId} error={errors.nationalId}>
            {(a11y) => <TextField {...a11y} value={values.nationalId} onChangeText={props.onNationalId} invalid={Boolean(errors.nationalId)} placeholder={texts.nationalIdPlaceholder} keyboardType="number-pad" returnKeyType="search" onSubmitEditing={props.onSearch} editable={editable} />}
          </FormField>
          <Button label={lookup === 'checking' ? texts.searching : texts.search} variant="outline" onPress={props.onSearch} loading={lookup === 'checking'} disabled={!editable} />
          {lookup === 'exists' ? <AppText variant="small" tone="primary">{texts.existing}</AppText> : null}
          {lookup === 'new' ? <AppText variant="small">{texts.unknown}</AppText> : null}
        </View>
        {lookup === 'new' ? (
          <View className="gap-5 rounded-lg bg-surface p-5">
            <AppText variant="title">{texts.clientSection}</AppText>
            <FormField label={texts.name} error={errors.fullName}>
              {(a11y) => <TextField {...a11y} value={values.fullName} onChangeText={(text) => { props.onText('fullName', text); }} invalid={Boolean(errors.fullName)} placeholder={texts.namePlaceholder} autoComplete="name" editable={editable} />}
            </FormField>
            <FormField label={texts.phone} error={errors.phone}>
              {(a11y) => <TextField {...a11y} value={values.phone} onChangeText={props.onPhone} invalid={Boolean(errors.phone)} placeholder={texts.phonePlaceholder} keyboardType="phone-pad" autoComplete="tel" editable={editable} />}
            </FormField>
            <FormField label={texts.occupation} error={errors.occupation}>
              {(a11y) => <TextField {...a11y} value={values.occupation} onChangeText={(text) => { props.onText('occupation', text); }} invalid={Boolean(errors.occupation)} placeholder={texts.occupationPlaceholder} editable={editable} />}
            </FormField>
            <FormField label={texts.address} error={errors.address}>
              {(a11y) => <TextField {...a11y} value={values.address} onChangeText={(text) => { props.onText('address', text); }} invalid={Boolean(errors.address)} placeholder={texts.addressPlaceholder} autoComplete="street-address" editable={editable} />}
            </FormField>
          </View>
        ) : null}
        {known ? (
          <View className="gap-5 rounded-lg bg-surface p-5">
            <AppText variant="title">{texts.loanSection}</AppText>
            {money('principal', texts.principal)}
            <FormField label={texts.count} error={errors.count}>
              {(a11y) => <TextField {...a11y} value={values.count} onChangeText={props.onCount} invalid={Boolean(errors.count)} keyboardType="number-pad" placeholder="30" editable={editable} />}
            </FormField>
            {money('installment', texts.installment)}
            {money('total', texts.total, props.totalSuggested ? texts.totalHint : undefined)}
            <FormField label={texts.frequency} error={errors.frequency}>
              {() => <SelectButton label={props.labels.frequency} active={values.frequency !== ''} onPress={() => { props.onOpen('frequency'); }} />}
            </FormField>
            <FormField label={texts.startDate} error={errors.startDate}>
              {() => <SelectButton label={props.labels.startDate} active onPress={() => { props.onOpen('startDate'); }} />}
            </FormField>
          </View>
        ) : null}
        {known ? (
          <View className="flex-row gap-3">
            <Button label={texts.cancel} variant="outline" className="flex-1" onPress={props.onCancel} disabled={!editable} />
            <Button label={texts.submit} className="flex-[1.6]" onPress={props.onSubmit} loading={props.submitting} />
          </View>
        ) : null}
        <AppText variant="caption" tone="muted">
          {texts.hint}
        </AppText>
      </ScrollView>
      <OptionSheet visible={props.sheets.active === 'frequency'} title={texts.frequency} options={props.sheets.frequency} selected={values.frequency} onSelect={props.onFrequency} onClose={props.sheets.onClose} />
      <DatePickerSheet visible={props.sheets.active === 'startDate'} title={texts.startDate} value={values.startDate} today={props.sheets.today} onSelect={props.onStartDate} onClose={props.sheets.onClose} />
    </View>
  );
}
