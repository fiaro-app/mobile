import { useRef } from 'react';
import type { TextInput } from 'react-native';
import { View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { Alert } from '@/components/molecules/Alert';
import { AuthHeader } from '@/components/molecules/AuthHeader';
import { FormField } from '@/components/molecules/FormField';
import type { FieldProps } from '@/lib/forms/field-props';

export interface LoginFormTexts {
  readonly title: string;
  readonly subtitle: string;
  readonly phoneLabel: string;
  readonly phonePlaceholder: string;
  readonly secretLabel: string;
  readonly maskedPlaceholder: string;
  readonly forgot: string;
  readonly submit: string;
}

export interface LoginFormProps {
  readonly texts: LoginFormTexts;
  readonly phone: FieldProps;
  readonly password: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly onSubmit: () => void;
  readonly onForgotPassword: () => void;
  /** Enlace "Crear cuenta" bajo el botón (registro de un negocio nuevo). */
  readonly register?: { readonly label: string; readonly onPress: () => void };
}

/**
 * Formulario de inicio de sesión (diseños "Login", "Login (Error)" y "Validación en tiempo real").
 * Solo dibuja: los valores, errores y el envío llegan por props desde `useLoginForm`. Los textos
 * también llegan por props para que este archivo no dependa de `features`.
 */
export function LoginForm({ texts, phone, password, submitting, formError, onSubmit, onForgotPassword, register }: Readonly<LoginFormProps>) {
  const passwordRef = useRef<TextInput>(null);
  return (
    <View className="gap-8">
      <AuthHeader title={texts.title} subtitle={texts.subtitle} />
      <View className="gap-5">
        {formError ? <Alert message={formError} /> : null}
        <FormField label={texts.phoneLabel} error={phone.error}>
          {(a11y) => (
            <TextField
              {...a11y}
              value={phone.value}
              onChangeText={phone.onChangeText}
              onBlur={phone.onBlur}
              invalid={Boolean(phone.error) || phone.invalid === true}
              placeholder={texts.phonePlaceholder}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!submitting}
            />
          )}
        </FormField>
        <FormField label={texts.secretLabel} error={password.error}>
          {(a11y) => (
            <TextField
              {...a11y}
              ref={passwordRef}
              value={password.value}
              onChangeText={password.onChangeText}
              onBlur={password.onBlur}
              invalid={Boolean(password.error) || password.invalid === true}
              placeholder={texts.maskedPlaceholder}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              editable={!submitting}
            />
          )}
        </FormField>
        <View className="items-end">
          <TextLink label={texts.forgot} onPress={onForgotPassword} />
        </View>
        <Button label={texts.submit} onPress={onSubmit} loading={submitting} />
        {register ? (
          <View className="items-center">
            <TextLink label={register.label} onPress={register.onPress} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
