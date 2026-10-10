import { View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';
import { Alert } from '@/components/molecules/Alert';
import { AuthHeader } from '@/components/molecules/AuthHeader';
import { FormField } from '@/components/molecules/FormField';
import type { FieldProps } from '@/lib/forms/field-props';

export interface ChangePasswordTexts {
  readonly title: string;
  readonly subtitle: string;
  readonly currentLabel: string;
  readonly newLabel: string;
  readonly confirmLabel: string;
  readonly hint: string;
  readonly submit: string;
  /** Texto del enlace de salida; sin él no se muestra (el cambio voluntario no atrapa a nadie). */
  readonly signOut?: string;
}

export interface ChangePasswordFormProps {
  readonly texts: ChangePasswordTexts;
  readonly currentPassword: FieldProps;
  readonly newPassword: FieldProps;
  readonly confirmPassword: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly onSubmit: () => void;
  readonly onSignOut?: () => void;
}

/**
 * Formulario "Crea tu contraseña" del primer ingreso. Pide también la contraseña temporal (el API la
 * exige como prueba, aunque el diseño original no la mostraba) y deja una salida ("Cerrar
 * sesión"): con una contraseña temporal la persona no puede hacer nada más, y sin salida un
 * teléfono prestado quedaría atrapado aquí.
 */
export function ChangePasswordForm(props: Readonly<ChangePasswordFormProps>) {
  const { texts, currentPassword, newPassword, confirmPassword, submitting, formError, onSubmit, onSignOut } = props;
  const secure = { secureTextEntry: true, autoCapitalize: 'none', editable: !submitting } as const;
  return (
    <View className="gap-8">
      <AuthHeader title={texts.title} subtitle={texts.subtitle} />
      <View className="gap-5">
        {formError ? <Alert message={formError} /> : null}
        <FormField label={texts.currentLabel} error={currentPassword.error}>
          {(a11y) => (
            <TextField
              {...a11y}
              {...secure}
              value={currentPassword.value}
              onChangeText={currentPassword.onChangeText}
              onBlur={currentPassword.onBlur}
              invalid={Boolean(currentPassword.error)}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="next"
            />
          )}
        </FormField>
        <FormField label={texts.newLabel} error={newPassword.error} hint={texts.hint}>
          {(a11y) => (
            <TextField
              {...a11y}
              {...secure}
              value={newPassword.value}
              onChangeText={newPassword.onChangeText}
              onBlur={newPassword.onBlur}
              invalid={Boolean(newPassword.error)}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />
          )}
        </FormField>
        <FormField label={texts.confirmLabel} error={confirmPassword.error}>
          {(a11y) => (
            <TextField
              {...a11y}
              {...secure}
              value={confirmPassword.value}
              onChangeText={confirmPassword.onChangeText}
              onBlur={confirmPassword.onBlur}
              invalid={Boolean(confirmPassword.error)}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />
          )}
        </FormField>
        <Button label={texts.submit} onPress={onSubmit} loading={submitting} />
        {texts.signOut && onSignOut ? (
          <View className="items-center">
            <TextLink label={texts.signOut} onPress={onSignOut} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
