import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { FormField } from '@/components/molecules/FormField';
import type { FieldProps } from '@/lib/forms/field-props';

export interface ClientFormViewProps {
  readonly intro: string | null;
  readonly texts: {
    readonly name: string;
    readonly namePlaceholder: string;
    readonly nationalId: string;
    readonly nationalIdPlaceholder: string;
    readonly phone: string;
    readonly phonePlaceholder: string;
    readonly occupation: string;
    readonly occupationPlaceholder: string;
    readonly address: string;
    readonly addressPlaceholder: string;
    readonly cancel: string;
  };
  readonly submitLabel: string;
  readonly fullName: FieldProps;
  readonly nationalId: FieldProps;
  readonly phone: FieldProps;
  readonly occupation: FieldProps;
  readonly address: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly notice: string | null;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

/** Formulario de cliente (registrar y editar): nombre, cédula, teléfono, oficio y dirección. Solo dibuja. */
export function ClientFormView(props: Readonly<ClientFormViewProps>) {
  const { texts, fullName, nationalId, phone, occupation, address } = props;
  const editable = !props.submitting;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
      {props.intro ? <AppText variant="small">{props.intro}</AppText> : null}
      <View className="gap-5 rounded-lg bg-surface p-5">
        {props.formError ? <Alert message={props.formError} /> : null}
        <FormField label={texts.name} error={fullName.error}>
          {(a11y) => <TextField {...a11y} value={fullName.value} onChangeText={fullName.onChangeText} onBlur={fullName.onBlur} invalid={Boolean(fullName.error)} placeholder={texts.namePlaceholder} autoComplete="name" returnKeyType="next" editable={editable} />}
        </FormField>
        <FormField label={texts.nationalId} error={nationalId.error}>
          {(a11y) => <TextField {...a11y} value={nationalId.value} onChangeText={nationalId.onChangeText} onBlur={nationalId.onBlur} invalid={Boolean(nationalId.error)} placeholder={texts.nationalIdPlaceholder} keyboardType="number-pad" returnKeyType="next" editable={editable} />}
        </FormField>
        <FormField label={texts.phone} error={phone.error}>
          {(a11y) => <TextField {...a11y} value={phone.value} onChangeText={phone.onChangeText} onBlur={phone.onBlur} invalid={Boolean(phone.error)} placeholder={texts.phonePlaceholder} keyboardType="phone-pad" autoComplete="tel" returnKeyType="next" editable={editable} />}
        </FormField>
        <FormField label={texts.occupation} error={occupation.error}>
          {(a11y) => <TextField {...a11y} value={occupation.value} onChangeText={occupation.onChangeText} onBlur={occupation.onBlur} invalid={Boolean(occupation.error)} placeholder={texts.occupationPlaceholder} returnKeyType="next" editable={editable} />}
        </FormField>
        <FormField label={texts.address} error={address.error}>
          {(a11y) => <TextField {...a11y} value={address.value} onChangeText={address.onChangeText} onBlur={address.onBlur} invalid={Boolean(address.error)} placeholder={texts.addressPlaceholder} autoComplete="street-address" returnKeyType="done" editable={editable} />}
        </FormField>
      </View>
      {props.notice ? (
        <AppText variant="small" tone="primary" accessibilityLiveRegion="polite">
          {props.notice}
        </AppText>
      ) : null}
      <View className="flex-row gap-3">
        <Button label={texts.cancel} variant="outline" className="flex-1" onPress={props.onCancel} disabled={!editable} />
        <Button label={props.submitLabel} className="flex-[1.6]" onPress={props.onSubmit} loading={props.submitting} />
      </View>
    </ScrollView>
  );
}
