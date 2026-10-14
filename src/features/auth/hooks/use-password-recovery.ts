import { useCallback, useState } from 'react';
import { requestPasswordReset, resetPassword } from '@/features/auth/api/access-api';
import { accessFailureMessage, ACCESS_COPY, TURNSTILE_LOAD_ERROR, TURNSTILE_PENDING } from '@/features/auth/content/access-messages';
import { cleanCode, validateRecoveryPhone, validateReset, type FieldErrors } from '@/features/auth/lib/access-forms';
import { formatPhoneInput } from '@/features/auth/lib/phone';
import { TURNSTILE_SITE_KEY } from '@/lib/config';

/** Pasos de la recuperación. */
export type RecoveryStep = 'request' | 'reset' | 'done';
type Field = 'phone' | 'code' | 'newPassword' | 'confirmPassword';

/** Todo lo que "Recuperar contraseña" dibuja y puede hacer. */
export interface PasswordRecovery {
  readonly step: RecoveryStep;
  readonly values: Record<Field, string>;
  readonly errors: FieldErrors<Field>;
  readonly formError: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly setField: (field: Field, text: string) => void;
  readonly sendCode: () => void;
  readonly resend: () => void;
  readonly submitReset: () => void;
  /** Cambia para pedir un desafío de Turnstile nuevo: cada pedido de código (y cada reenvío) gasta un token. */
  readonly turnstileResetKey: number;
  readonly setTurnstileToken: (token: string | null) => void;
  readonly turnstileError: () => void;
}

const EMPTY: Record<Field, string> = { phone: '', code: '', newPassword: '', confirmPassword: '' };

/**
 * Lógica de recuperar la contraseña en tres pasos: pedir el código (por correo, al correo de contacto de la cuenta), canjearlo
 * por una contraseña nueva y listo. El API responde igual exista o no la cuenta (no revela quién tiene cuenta), así que el
 * segundo paso se muestra siempre. Al cambiar la contraseña el API cierra todas las sesiones de la persona.
 */
export function usePasswordRecovery(): PasswordRecovery {
  const [step, setStep] = useState<RecoveryStep>('request');
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileError = useCallback(() => {
    setFormError(TURNSTILE_LOAD_ERROR);
  }, []);

  const request = async (afterSend: () => void, message: string | null) => {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setFormError(TURNSTILE_PENDING);
      return;
    }
    setBusy(true);
    setFormError(null);
    setTurnstileToken(null);
    setTurnstileResetKey((current) => current + 1);
    const result = await requestPasswordReset(values.phone, turnstileToken ?? undefined);
    setBusy(false);
    if (!result.ok) {
      setFormError(accessFailureMessage(result.failure));
      return;
    }
    setNotice(message);
    afterSend();
  };

  return {
    step,
    values,
    errors,
    formError,
    notice,
    busy,
    turnstileResetKey,
    setTurnstileToken,
    turnstileError,
    setField: (field, text) => {
      let next = text;
      if (field === 'phone') next = formatPhoneInput(text);
      else if (field === 'code') next = cleanCode(text);
      setValues((current) => ({ ...current, [field]: next }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    },
    sendCode: () => {
      const problems = validateRecoveryPhone(values.phone);
      setErrors(problems);
      if (Object.keys(problems).length > 0) return;
      void request(() => {
        setStep('reset');
      }, null);
    },
    resend: () => {
      void request(() => undefined, ACCESS_COPY.recovery.resent);
    },
    submitReset: () => {
      const problems = validateReset(values);
      setErrors(problems);
      if (Object.keys(problems).length > 0) return;
      void (async () => {
        setBusy(true);
        setFormError(null);
        const result = await resetPassword({ phone: values.phone, code: values.code, newPassword: values.newPassword });
        setBusy(false);
        if (!result.ok) {
          setFormError(accessFailureMessage(result.failure));
          return;
        }
        setStep('done');
      })();
    },
  };
}
