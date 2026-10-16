import { useCallback, useState } from 'react';
import { registerOwner } from '@/features/auth/api/access-api';
import { TURNSTILE_LOAD_ERROR, TURNSTILE_PENDING, accessFailureMessage } from '@/features/auth/content/access-messages';
import { validateAccountStep, validateCompanyStep, type FieldErrors, type RegisterValues } from '@/features/auth/lib/access-forms';
import { EMPTY_CONSENTS, missingConsents, type Consents } from '@/features/auth/lib/consents';
import { formatPhoneInput } from '@/features/auth/lib/phone';
import { TURNSTILE_SITE_KEY } from '@/lib/config';

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
  readonly consents: Consents;
  /** Autorizaciones obligatorias que faltan tras intentar enviar. */
  readonly consentErrors: readonly (keyof Consents)[];
  readonly setConsent: (key: keyof Consents, value: boolean) => void;
  readonly setField: (field: Field, text: string) => void;
  readonly next: () => void;
  readonly back: () => void;
  readonly submit: () => void;
  /** Cambia para pedir un desafío de Turnstile nuevo (cada token sirve una vez). */
  readonly turnstileResetKey: number;
  readonly setTurnstileToken: (token: string | null) => void;
  readonly turnstileError: () => void;
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
  const [consents, setConsents] = useState<Consents>(EMPTY_CONSENTS);
  const [consentErrors, setConsentErrors] = useState<readonly (keyof Consents)[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileError = useCallback(() => {
    setFormError(TURNSTILE_LOAD_ERROR);
  }, []);

  return {
    step,
    values,
    errors,
    formError,
    busy,
    turnstileResetKey,
    setTurnstileToken,
    turnstileError,
    consents,
    consentErrors,
    setConsent: (key, value) => {
      setConsents((current) => ({ ...current, [key]: value }));
      setConsentErrors((current) => current.filter((item) => item !== key));
    },
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
      const missing = missingConsents(consents);
      if (missing.length > 0) {
        setConsentErrors(missing);
        return;
      }
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        setFormError(TURNSTILE_PENDING);
        return;
      }
      void (async () => {
        setBusy(true);
        setFormError(null);
        const result = await registerOwner({ ...values, fullName: values.fullName.trim(), businessName: values.businessName.trim(), contactEmail: values.contactEmail.trim(), marketingConsent: consents.marketing, turnstileToken: turnstileToken ?? undefined });
        setBusy(false);
        if (result.ok) {
          setStep('done');
          return;
        }
        setTurnstileToken(null);
        setTurnstileResetKey((current) => current + 1);
        setFormError(accessFailureMessage(result.failure));
        if (result.failure.kind === 'http' && result.failure.code && ACCOUNT_CODES.has(result.failure.code)) setStep('account');
      })();
    },
  };
}
