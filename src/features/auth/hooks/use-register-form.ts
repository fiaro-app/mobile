import { useState } from 'react';
import { registerOwner } from '@/features/auth/api/access-api';
import { accessFailureMessage } from '@/features/auth/content/access-messages';
import { validateAccountStep, validateCompanyStep, type FieldErrors, type RegisterValues } from '@/features/auth/lib/access-forms';
import { formatPhoneInput } from '@/features/auth/lib/phone';

/** Pasos del registro. */
export type RegisterStep = 'account' | 'company' | 'done';
type Field = keyof RegisterValues;

/** Todo lo que el registro dibuja y puede hacer. */
export interface RegisterForm {
  readonly step: RegisterStep;
  readonly values: RegisterValues;
  readonly errors: FieldErrors<Field>;
  readonly formError: string | null;
  readonly busy: boolean;
  readonly setField: (field: Field, text: string) => void;
  readonly next: () => void;
  readonly back: () => void;
  readonly submit: () => void;
}

const EMPTY: RegisterValues = { fullName: '', nationalId: '', phone: '', contactEmail: '', password: '', businessName: '' };

/** Campos que, si el API los rechaza, hay que mostrar en el paso 1 aunque el error llegue al enviar el paso 2. */
const ACCOUNT_CODES = new Set(['PHONE_ALREADY_REGISTERED', 'INVALID_PHONE', 'PASSWORD_TOO_WEAK', 'INVALID_PASSWORD_LENGTH']);

/**
 * Lógica del registro de un dueño y su negocio, en dos pasos (cuenta y empresa). El paso 2 envía `POST /register`, que NO abre
 * sesión: al terminar se invita a iniciarla. Si el API rechaza algo del paso 1 (celular ya registrado, contraseña débil) se
 * vuelve a ese paso con el mensaje.
 */
export function useRegisterForm(): RegisterForm {
  const [step, setStep] = useState<RegisterStep>('account');
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return {
    step,
    values,
    errors,
    formError,
    busy,
    setField: (field, text) => {
      setValues((current) => ({ ...current, [field]: field === 'phone' ? formatPhoneInput(text) : text }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    },
    next: () => {
      const problems = validateAccountStep(values);
      setErrors(problems);
      if (Object.keys(problems).length === 0) setStep('company');
    },
    back: () => {
      setFormError(null);
      setStep('account');
    },
    submit: () => {
      const problems = validateCompanyStep(values);
      setErrors(problems);
      if (Object.keys(problems).length > 0) return;
      void (async () => {
        setBusy(true);
        setFormError(null);
        const result = await registerOwner({ ...values, fullName: values.fullName.trim(), businessName: values.businessName.trim(), contactEmail: values.contactEmail.trim() });
        setBusy(false);
        if (result.ok) {
          setStep('done');
          return;
        }
        setFormError(accessFailureMessage(result.failure));
        if (result.failure.kind === 'http' && result.failure.code && ACCOUNT_CODES.has(result.failure.code)) setStep('account');
      })();
    },
  };
}
