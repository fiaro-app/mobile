import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { Alert } from '@/components/molecules/Alert';
import { FormField } from '@/components/molecules/FormField';
import type { FieldProps } from '@/lib/forms/field-props';

export interface EmailVerificationView {
  readonly title: string;
  readonly message: string;
  readonly codeSent: boolean;
  readonly codeLabel: string;
  readonly code: string;
  readonly sendLabel: string;
  readonly verifyLabel: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly onCode: (text: string) => void;
  readonly onSend: () => void;
  readonly onVerify: () => void;
}

export interface EditProfileFormProps {
  readonly nameLabel: string;
  readonly emailLabel: string;
  readonly emailHint: string;
  readonly saveLabel: string;
  readonly fullName: FieldProps;
  readonly contactEmail: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly notice: string | null;
  readonly onSubmit: () => void;
  /** Sección de verificación del correo; `null` cuando no aplica (sin correo o ya verificado). */
  readonly verification: EmailVerificationView | null;
}

/** Formulario "Editar perfil" (nombre y correo) y, debajo, la verificación del correo si hace falta. Solo dibuja. */
export function EditProfileForm(props: Readonly<EditProfileFormProps>) {
  const { fullName, contactEmail, verification } = props;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-5">
      {props.formError ? <Alert message={props.formError} /> : null}
      <FormField label={props.nameLabel} error={fullName.error}>
        {(a11y) => (
          <TextField {...a11y} value={fullName.value} onChangeText={fullName.onChangeText} onBlur={fullName.onBlur} invalid={Boolean(fullName.error)} autoComplete="name" textContentType="name" returnKeyType="next" editable={!props.submitting} />
        )}
      </FormField>
      <FormField label={props.emailLabel} error={contactEmail.error} hint={props.emailHint}>
        {(a11y) => (
          <TextField
            {...a11y}
            value={contactEmail.value}
            onChangeText={contactEmail.onChangeText}
            onBlur={contactEmail.onBlur}
            invalid={Boolean(contactEmail.error)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="go"
            onSubmitEditing={props.onSubmit}
            editable={!props.submitting}
          />
        )}
      </FormField>
      {props.notice ? (
        <AppText variant="small" tone="primary" accessibilityLiveRegion="polite">
          {props.notice}
        </AppText>
      ) : null}
      <Button label={props.saveLabel} onPress={props.onSubmit} loading={props.submitting} />
      {verification ? (
        <View className="gap-3 rounded-md border border-foreground/10 bg-surface p-4">
          <AppText variant="label">{verification.title}</AppText>
          <AppText variant="small">{verification.message}</AppText>
          {verification.error ? <Alert message={verification.error} /> : null}
          {verification.notice ? <AppText variant="small" tone="primary">{verification.notice}</AppText> : null}
          {verification.codeSent ? (
            <FormField label={verification.codeLabel}>
              {(a11y) => <TextField {...a11y} value={verification.code} onChangeText={verification.onCode} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" editable={!verification.busy} />}
            </FormField>
          ) : null}
          {verification.codeSent ? <Button label={verification.verifyLabel} onPress={verification.onVerify} loading={verification.busy} /> : null}
          <Button label={verification.sendLabel} variant={verification.codeSent ? 'outline' : 'primary'} onPress={verification.onSend} loading={verification.busy && !verification.codeSent} />
        </View>
      ) : null}
    </ScrollView>
  );
}
