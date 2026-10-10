import { View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { Alert } from '@/components/molecules/Alert';
import { AuthHeader } from '@/components/molecules/AuthHeader';
import { FormField } from '@/components/molecules/FormField';

type Field = 'fullName' | 'nationalId' | 'phone' | 'contactEmail' | 'password' | 'businessName';

export interface RegisterViewProps {
  readonly step: 'account' | 'company' | 'done';
  readonly texts: {
    readonly accountTitle: string; readonly companyTitle: string; readonly accountSubtitle: string; readonly companySubtitle: string; readonly fullName: string; readonly fullNamePlaceholder: string;
    readonly nationalId: string; readonly nationalIdPlaceholder: string; readonly phone: string; readonly phonePlaceholder: string; readonly email: string; readonly emailPlaceholder: string;
    readonly password: string; readonly hint: string; readonly business: string; readonly businessPlaceholder: string; readonly next: string; readonly submit: string; readonly back: string;
    readonly doneTitle: string; readonly doneSubtitle: string; readonly toLogin: string;
  };
  readonly values: Record<Field, string>;
  readonly errors: Partial<Record<Field, string>>;
  readonly formError: string | null;
  readonly busy: boolean;
  readonly onField: (field: Field, text: string) => void;
  readonly onNext: () => void;
  readonly onBack: () => void;
  readonly onSubmit: () => void;
  readonly onToLogin: () => void;
  readonly onCancel: () => void;
}

/** Registro de un negocio en dos pasos (cuenta y empresa) y la pantalla final. Solo dibuja. */
export function RegisterView(props: Readonly<RegisterViewProps>) {
  const { texts, values, errors } = props;
  const text = (field: Field, label: string, placeholder: string, extra: Record<string, unknown> = {}, hint?: string) => (
    <FormField label={label} error={errors[field]} hint={hint}>
      {(a11y) => <TextField {...a11y} value={values[field]} onChangeText={(value) => { props.onField(field, value); }} invalid={Boolean(errors[field])} placeholder={placeholder} editable={!props.busy} {...extra} />}
    </FormField>
  );
  if (props.step === 'done') {
    return (
      <View className="gap-8">
        <AuthHeader title={texts.doneTitle} subtitle={texts.doneSubtitle} />
        <Button label={texts.toLogin} onPress={props.onToLogin} />
      </View>
    );
  }
  const account = props.step === 'account';
  return (
    <View className="gap-8">
      <AuthHeader title={account ? texts.accountTitle : texts.companyTitle} subtitle={account ? texts.accountSubtitle : texts.companySubtitle} />
      <View className="gap-5">
        {props.formError ? <Alert message={props.formError} /> : null}
        {account ? (
          <>
            {text('fullName', texts.fullName, texts.fullNamePlaceholder, { autoComplete: 'name' })}
            {text('nationalId', texts.nationalId, texts.nationalIdPlaceholder, { keyboardType: 'number-pad' })}
            {text('phone', texts.phone, texts.phonePlaceholder, { keyboardType: 'phone-pad', autoComplete: 'tel' })}
            {text('contactEmail', texts.email, texts.emailPlaceholder, { keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email' })}
            {text('password', texts.password, '••••••••', { secureTextEntry: true, autoCapitalize: 'none', autoComplete: 'new-password' }, texts.hint)}
            <Button label={texts.next} onPress={props.onNext} />
            <View className="items-center">
              <TextLink label={texts.toLogin} onPress={props.onCancel} />
            </View>
          </>
        ) : (
          <>
            {text('businessName', texts.business, texts.businessPlaceholder)}
            <Button label={texts.submit} onPress={props.onSubmit} loading={props.busy} />
            <View className="items-center">
              <TextLink label={texts.back} onPress={props.onBack} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}
