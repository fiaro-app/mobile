import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { signInWithPhone } from '@/features/auth/api/auth-api';
import { signInFailureMessage } from '@/features/auth/content/messages';
import { toSignInFailure } from '@/features/auth/lib/auth-failure';
import { formatPhoneInput, toMobileE164 } from '@/features/auth/lib/phone';
import { loginSchema, type LoginValues } from '@/features/auth/schemas/login-schema';
import { completeSignIn } from '@/features/auth/store/session-actions';
import type { FieldProps } from '@/lib/forms/field-props';

/** Lo que el formulario de login necesita: dos campos, el envío y el error del servidor. */
export interface LoginForm {
  readonly phone: FieldProps;
  readonly password: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly submit: () => void;
}

/**
 * Lógica del login: validación mientras se escribe (la primera vez al salir del campo y después en
 * cada tecla: avisar de un error al primer dígito resulta agresivo), formato del celular y envío
 * al API. Cuando las credenciales son inválidas el error se muestra sobre el formulario y ambos
 * campos quedan en rojo, como en el diseño "Login (Error)": el API no dice cuál de los dos falló
 * y la app tampoco debe sugerirlo.
 */
export function useLoginForm(): LoginForm {
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { phone: '', password: '' },
  });
  const phone = useController({ control, name: 'phone' });
  const password = useController({ control, name: 'password' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [credentialsRejected, setCredentialsRejected] = useState(false);

  const clearServerError = () => {
    setFormError(null);
    setCredentialsRejected(false);
  };

  const onValid = async (values: LoginValues) => {
    const e164 = toMobileE164(values.phone);
    if (!e164) return;
    setSubmitting(true);
    clearServerError();
    const result = await signInWithPhone(e164, values.password);
    if (result.ok) {
      await completeSignIn(result.value);
      return;
    }
    const failure = toSignInFailure(result.failure);
    setFormError(signInFailureMessage(failure));
    setCredentialsRejected(failure.kind === 'invalid-credentials');
    setSubmitting(false);
  };

  return {
    phone: {
      value: phone.field.value,
      error: phone.fieldState.error?.message ?? null,
      invalid: credentialsRejected,
      onChangeText: (text) => {
        clearServerError();
        phone.field.onChange(formatPhoneInput(text));
      },
      onBlur: phone.field.onBlur,
    },
    password: {
      value: password.field.value,
      error: password.fieldState.error?.message ?? null,
      invalid: credentialsRejected,
      onChangeText: (text) => {
        clearServerError();
        password.field.onChange(text);
      },
      onBlur: password.field.onBlur,
    },
    submitting,
    formError,
    submit: () => {
      void handleSubmit(onValid)();
    },
  };
}
