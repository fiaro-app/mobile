import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { signInWithIdentifier } from '@/features/auth/api/auth-api';
import { signInFailureMessage } from '@/features/auth/content/messages';
import { toSignInFailure } from '@/features/auth/lib/auth-failure';
import { formatIdentifierInput, identifierToSignIn } from '@/features/auth/lib/identifier';
import { loginSchema, type LoginValues } from '@/features/auth/schemas/login-schema';
import { completeSignIn } from '@/features/auth/store/session-actions';
import type { FieldProps } from '@/lib/forms/field-props';

/** Lo que el formulario de login necesita: dos campos (correo o celular, y contraseña), el envío y el error del servidor. */
export interface LoginForm {
  readonly identifier: FieldProps;
  readonly password: FieldProps;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly submit: () => void;
}

/**
 * Lógica del login: validación mientras se escribe (la primera vez al salir del campo y después en
 * cada tecla: avisar de un error al primer dígito resulta agresivo), formato del celular (si lo que se escribe no parece un correo) y envío
 * al API. Cuando las credenciales son inválidas el error se muestra sobre el formulario y ambos
 * campos quedan en rojo, como en el diseño "Login (Error)": el API no dice cuál de los dos falló
 * y la app tampoco debe sugerirlo.
 */
export function useLoginForm(): LoginForm {
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { identifier: '', password: '' },
  });
  const identifier = useController({ control, name: 'identifier' });
  const password = useController({ control, name: 'password' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [credentialsRejected, setCredentialsRejected] = useState(false);

  const clearServerError = () => {
    setFormError(null);
    setCredentialsRejected(false);
  };

  const onValid = async (values: LoginValues) => {
    const resolved = identifierToSignIn(values.identifier);
    if (!resolved) return;
    setSubmitting(true);
    clearServerError();
    const result = await signInWithIdentifier(resolved, values.password);
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
    identifier: {
      value: identifier.field.value,
      error: identifier.fieldState.error?.message ?? null,
      invalid: credentialsRejected,
      onChangeText: (text) => {
        clearServerError();
        identifier.field.onChange(formatIdentifierInput(text));
      },
      onBlur: identifier.field.onBlur,
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
