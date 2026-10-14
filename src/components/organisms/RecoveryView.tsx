import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { Alert } from '@/components/molecules/Alert';
import { AuthHeader } from '@/components/molecules/AuthHeader';
import { FormField } from '@/components/molecules/FormField';

type Field = 'phone' | 'code' | 'newPassword' | 'confirmPassword';

export interface RecoveryViewProps {
  readonly step: 'request' | 'reset' | 'done';
  readonly texts: {
    readonly requestTitle: string; readonly requestSubtitle: string; readonly phone: string; readonly phonePlaceholder: string; readonly sendCode: string;
    readonly sentTitle: string; readonly sentSubtitle: string; readonly code: string; readonly newPassword: string; readonly confirmPassword: string; readonly hint: string;
    readonly reset: string; readonly resend: string; readonly noEmail: string; readonly doneTitle: string; readonly doneSubtitle: string; readonly toLogin: string; readonly back: string;
  };
  readonly values: Record<Field, string>;
  readonly errors: Partial<Record<Field, string>>;
  readonly formError: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly onField: (field: Field, text: string) => void;
  readonly onSendCode: () => void;
  readonly onResend: () => void;
  readonly onReset: () => void;
  readonly onToLogin: () => void;
  readonly onBack: () => void;
  /** Verificación contra robots (Turnstile): antes de pedir el código y, en el paso 2, antes de reenviarlo. */
  readonly verification?: ReactNode;
}

/** "Recuperar contraseña" en tres pasos (celular, código y contraseña nueva, listo). Solo dibuja. */
export function RecoveryView(props: Readonly<RecoveryViewProps>) {
  const { texts, values, errors } = props;
  if (props.step === 'done') {
    return (
      <View className="gap-8">
        <AuthHeader title={texts.doneTitle} subtitle={texts.doneSubtitle} />
        <Button label={texts.toLogin} onPress={props.onToLogin} />
      </View>
    );
  }
  const secure = { secureTextEntry: true, autoCapitalize: 'none', editable: !props.busy } as const;
  return (
    <View className="gap-8">
      <AuthHeader title={props.step === 'request' ? texts.requestTitle : texts.sentTitle} subtitle={props.step === 'request' ? texts.requestSubtitle : texts.sentSubtitle} />
      <View className="gap-5">
        {props.formError ? <Alert message={props.formError} /> : null}
        {props.step === 'request' ? (
          <>
            <FormField label={texts.phone} error={errors.phone}>
              {(a11y) => <TextField {...a11y} value={values.phone} onChangeText={(text) => { props.onField('phone', text); }} invalid={Boolean(errors.phone)} placeholder={texts.phonePlaceholder} keyboardType="phone-pad" autoComplete="tel" returnKeyType="go" onSubmitEditing={props.onSendCode} editable={!props.busy} />}
            </FormField>
            {props.verification}
            <Button label={texts.sendCode} onPress={props.onSendCode} loading={props.busy} />
            <AppText variant="caption" tone="muted" className="text-center">
              {texts.noEmail}
            </AppText>
          </>
        ) : (
          <>
            <FormField label={texts.code} error={errors.code}>
              {(a11y) => <TextField {...a11y} value={values.code} onChangeText={(text) => { props.onField('code', text); }} invalid={Boolean(errors.code)} placeholder="000000" keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} editable={!props.busy} />}
            </FormField>
            <FormField label={texts.newPassword} error={errors.newPassword} hint={texts.hint}>
              {(a11y) => <TextField {...a11y} {...secure} value={values.newPassword} onChangeText={(text) => { props.onField('newPassword', text); }} invalid={Boolean(errors.newPassword)} autoComplete="new-password" textContentType="newPassword" />}
            </FormField>
            <FormField label={texts.confirmPassword} error={errors.confirmPassword}>
              {(a11y) => <TextField {...a11y} {...secure} value={values.confirmPassword} onChangeText={(text) => { props.onField('confirmPassword', text); }} invalid={Boolean(errors.confirmPassword)} autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={props.onReset} />}
            </FormField>
            {props.notice ? <AppText variant="small" tone="primary">{props.notice}</AppText> : null}
            <Button label={texts.reset} onPress={props.onReset} loading={props.busy} />
            {props.verification}
            <View className="items-center">
              <TextLink label={texts.resend} onPress={props.onResend} />
            </View>
          </>
        )}
        <View className="items-center">
          <TextLink label={texts.back} onPress={props.onBack} />
        </View>
      </View>
    </View>
  );
}
