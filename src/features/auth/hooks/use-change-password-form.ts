import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { changePassword } from '@/features/auth/api/auth-api';
import { changePasswordFailureMessage } from '@/features/auth/content/messages';
import { toChangePasswordFailure } from '@/features/auth/lib/auth-failure';
import { changePasswordSchema, type ChangePasswordValues } from '@/features/auth/schemas/change-password-schema';
import { completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import type { FieldProps } from '@/lib/forms/field-props';

/** Lo que el formulario de cambio de contraseña necesita. */
export interface ChangePasswordForm {
  readonly currentPassword: FieldProps;
  readonly newPassword: FieldProps;
  readonly confirmPassword: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly submit: () => void;
  readonly onSignOut: () => void;
}

/**
 * Lógica del cambio de contraseña del primer ingreso. Si el API responde que la sesión venció
 * (`session-expired`) se cierra la sesión local para volver al login, en lugar de dejar un
 * formulario que ya no puede funcionar. Al terminar bien, `userUpdated` baja la marca de
 * contraseña temporal y las rutas protegidas dejan pasar a la siguiente pantalla.
 */
export function useChangePasswordForm(): ChangePasswordForm {
  const { control, handleSubmit } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const current = useController({ control, name: 'currentPassword' });
  const next = useController({ control, name: 'newPassword' });
  const confirm = useController({ control, name: 'confirmPassword' });
  const userUpdated = useSessionStore((state) => state.userUpdated);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const bind = (controller: typeof current | typeof next | typeof confirm): FieldProps => ({
    value: controller.field.value,
    error: controller.fieldState.error?.message ?? null,
    onChangeText: (text) => {
      setFormError(null);
      controller.field.onChange(text);
    },
    onBlur: controller.field.onBlur,
  });

  const onValid = async (values: ChangePasswordValues) => {
    setSubmitting(true);
    setFormError(null);
    const result = await changePassword(values.currentPassword, values.newPassword);
    if (result.ok) {
      userUpdated(result.value);
      return;
    }
    const failure = toChangePasswordFailure(result.failure);
    setSubmitting(false);
    if (failure.kind === 'session-expired') {
      await completeSignOut();
      return;
    }
    setFormError(changePasswordFailureMessage(failure));
  };

  return {
    currentPassword: bind(current),
    newPassword: bind(next),
    confirmPassword: bind(confirm),
    submitting,
    formError,
    submit: () => {
      void handleSubmit(onValid)();
    },
    onSignOut: () => {
      void completeSignOut();
    },
  };
}
