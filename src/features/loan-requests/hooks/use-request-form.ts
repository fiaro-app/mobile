import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { formatPhoneInput } from '@/features/auth/lib/phone';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { createLoanRequest, lookupClient } from '@/features/loan-requests/api/requests-api';
import { requestFailureMessage } from '@/features/loan-requests/content/messages';
import { isValidNationalId, validateRequestForm, type RequestField, type RequestFormValues } from '@/features/loan-requests/lib/request-form';
import { FREQUENCY_OPTIONS } from '@/features/loans/lib/frequency-options';
import { suggestTotal } from '@/features/loans/lib/loan-form';
import { describeStartDate } from '@/features/loans/lib/start-dates';
import { formatAmountInput, parseAmountInput } from '@/features/visit/lib/amount';
import { businessDateOf } from '@/lib/business-date';

/** Qué se sabe de la cédula escrita: `exists` ya es del negocio, `new` hay que registrarlo. */
export type LookupState = 'idle' | 'checking' | 'exists' | 'new';

/** Hoja abierta sobre el formulario. */
export type RequestSheet = 'none' | 'frequency' | 'startDate';

/** Todo lo que "Sugerir un préstamo" dibuja y puede hacer. */
export interface RequestForm {
  readonly values: RequestFormValues;
  readonly errors: Partial<Record<RequestField, string>>;
  readonly lookup: LookupState;
  readonly frequencyLabel: string;
  readonly startDateLabel: string;
  readonly totalSuggested: boolean;
  readonly frequencyOptions: typeof FREQUENCY_OPTIONS;
  readonly today: string;
  readonly sheet: RequestSheet;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly sent: boolean;
  readonly setText: (field: 'fullName' | 'occupation' | 'address', text: string) => void;
  readonly setNationalId: (text: string) => void;
  readonly setPhone: (text: string) => void;
  readonly setAmount: (field: 'principal' | 'installment' | 'total', text: string) => void;
  readonly setCount: (text: string) => void;
  readonly setFrequency: (value: string) => void;
  readonly setStartDate: (value: string) => void;
  readonly openSheet: (sheet: Exclude<RequestSheet, 'none'>) => void;
  readonly closeSheet: () => void;
  readonly search: () => void;
  readonly submit: () => void;
}

function initialValues(): RequestFormValues {
  return { nationalId: '', fullName: '', phone: '', occupation: '', address: '', principal: '', count: '', installment: '', total: '', frequency: '', startDate: businessDateOf() };
}

/**
 * Lógica de "Sugerir un préstamo" del cobrador. Primero consulta la cédula (solo dice si ya es del negocio: nunca
 * muestra datos de un cliente que el cobrador no conoce); si existe pide solo las condiciones y si no, también los datos
 * del cliente nuevo. El **total a pagar se sugiere** (cuotas × cuota) mientras no se escriba a mano. Cambiar la cédula
 * borra el resultado de la consulta.
 */
export function useRequestForm(): RequestForm {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<RequestFormValues>(initialValues);
  const [totalTouched, setTotalTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<RequestField, string>>>({});
  const [lookup, setLookup] = useState<LookupState>('idle');
  const [sheet, setSheet] = useState<RequestSheet>('none');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const today = businessDateOf();

  const update = (patch: Partial<RequestFormValues>, field: RequestField | null, recalc = false) => {
    setValues((current) => {
      const next = { ...current, ...patch };
      if (recalc && !totalTouched) {
        const total = suggestTotal(/^\d+$/.test(next.count) ? Number(next.count) : null, parseAmountInput(next.installment));
        return { ...next, total: total === null ? '' : formatAmountInput(String(total)) };
      }
      return next;
    });
    if (field) setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  return {
    values,
    errors,
    lookup,
    frequencyLabel: FREQUENCY_OPTIONS.find((option) => option.value === values.frequency)?.label ?? 'Elige la frecuencia',
    startDateLabel: describeStartDate(values.startDate, today),
    totalSuggested: !totalTouched && values.total !== '',
    frequencyOptions: FREQUENCY_OPTIONS,
    today,
    sheet,
    submitting,
    formError,
    sent,
    setText: (field, text) => {
      update({ [field]: text }, field);
    },
    setNationalId: (text) => {
      setLookup('idle');
      update({ nationalId: text.replaceAll(/[^\d.\s-]/g, '') }, 'nationalId');
    },
    setPhone: (text) => {
      update({ phone: formatPhoneInput(text) }, 'phone');
    },
    setAmount: (field, text) => {
      if (field === 'total') setTotalTouched(true);
      update({ [field]: formatAmountInput(text) }, field, field !== 'total');
    },
    setCount: (text) => {
      update({ count: text.replaceAll(/\D/g, '') }, 'count', true);
    },
    setFrequency: (value) => {
      update({ frequency: value as RequestFormValues['frequency'] }, 'frequency');
      setSheet('none');
    },
    setStartDate: (value) => {
      update({ startDate: value }, 'startDate');
      setSheet('none');
    },
    openSheet: setSheet,
    closeSheet: () => {
      setSheet('none');
    },
    search: () => {
      if (lookup === 'checking') return;
      if (!isValidNationalId(values.nationalId)) {
        setErrors((current) => ({ ...current, nationalId: 'Escribe una cédula válida (3 a 10 dígitos).' }));
        return;
      }
      void (async () => {
        setLookup('checking');
        setFormError(null);
        const result = await lookupClient(values.nationalId);
        if (!result.ok) {
          setLookup('idle');
          signOutIfSessionExpired(result.failure);
          setFormError(requestFailureMessage(result.failure));
          return;
        }
        setLookup(result.value ? 'exists' : 'new');
      })();
    },
    submit: () => {
      if (submitting || sent || (lookup !== 'exists' && lookup !== 'new')) return;
      const validation = validateRequestForm(values, lookup === 'new');
      if (!validation.ok) {
        setErrors(validation.errors);
        setFormError('Revisa los campos marcados en rojo antes de continuar.');
        return;
      }
      void (async () => {
        setSubmitting(true);
        setErrors({});
        setFormError(null);
        const created = await createLoanRequest(validation.body);
        setSubmitting(false);
        if (!created.ok) {
          signOutIfSessionExpired(created.failure);
          setFormError(requestFailureMessage(created.failure));
          return;
        }
        void queryClient.invalidateQueries({ queryKey: ['admin', 'loan-requests'] });
        setSent(true);
      })();
    },
  };
}
