import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { FormField } from '@/components/molecules/FormField';
import type { FieldProps } from '@/lib/forms/field-props';

export interface AdminFormViewProps {
  readonly texts: {
    readonly intro: string;
    readonly name: string;
    readonly namePlaceholder: string;
    readonly nationalId: string;
    readonly nationalIdPlaceholder: string;
    readonly phone: string;
    readonly phonePlaceholder: string;
    readonly contactEmail: string;
    readonly contactEmailPlaceholder: string;
    readonly cancel: string;
    readonly submit: string;
  };
  readonly fullName: FieldProps;
  readonly nationalId: FieldProps;
  readonly phone: FieldProps;
  readonly contactEmail: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}

/** Formulario "Invitar administrador": nombre, cédula, celular y correo, con los botones. Solo dibuja. */
export function AdminFormView(props: Readonly<AdminFormViewProps>) {
  const { texts, fullName, nationalId, phone, contactEmail } = props;
  const editable = !props.submitting;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
      <AppText variant="small">{texts.intro}</AppText>
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
        <FormField label={texts.contactEmail} error={contactEmail.error}>
          {(a11y) => <TextField {...a11y} value={contactEmail.value} onChangeText={contactEmail.onChangeText} onBlur={contactEmail.onBlur} invalid={Boolean(contactEmail.error)} placeholder={texts.contactEmailPlaceholder} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="done" editable={editable} />}
        </FormField>
      </View>
      <View className="flex-row gap-3">
        <Button label={texts.cancel} variant="outline" className="flex-1" onPress={props.onCancel} disabled={!editable} />
        <Button label={texts.submit} className="flex-[1.6]" onPress={props.onSubmit} loading={props.submitting} />
      </View>
    </ScrollView>
  );
}
