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

/** Lo que el formulario de cambio voluntario de contraseña necesita. */
export interface AccountPassword {
  readonly currentPassword: FieldProps;
  readonly newPassword: FieldProps;
  readonly confirmPassword: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly submit: () => void;
}

/**
 * Cambio de contraseña desde el Perfil (a diferencia del primer ingreso, la persona puede volver atrás). Pide la actual y
 * valida igual que el cambio obligatorio. Si el API dice que la sesión venció se cierra la local. Al terminar bien
 * `userUpdated` refresca la sesión (la cookie se reemplaza por la nueva) y se llama `onDone` para volver al Perfil.
 */
export function useAccountPassword(onDone: () => void): AccountPassword {
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
    setSubmitting(false);
    if (result.ok) {
      userUpdated(result.value);
      onDone();
      return;
    }
    const failure = toChangePasswordFailure(result.failure);
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
  };
}
