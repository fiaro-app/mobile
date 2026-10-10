import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { useClientNames } from '@/features/clients/hooks/use-client-names';
import { assignCollector, createLoan } from '@/features/loans/api/loans-api';
import { loanFailureMessage } from '@/features/loans/content/messages';
import { FREQUENCY_OPTIONS } from '@/features/loans/lib/frequency-options';
import { suggestTotal, validateLoanForm, type LoanField, type LoanFormValues } from '@/features/loans/lib/loan-form';
import { startDateOptions } from '@/features/loans/lib/start-dates';
import { useMembers } from '@/features/team/hooks/use-members';
import { formatAmountInput, parseAmountInput } from '@/features/visit/lib/amount';
import { businessDateOf } from '@/lib/business-date';

/** Hoja abierta sobre el formulario. */
export type LoanSheet = 'none' | 'client' | 'frequency' | 'startDate' | 'collector';

/** Todo lo que "Nuevo préstamo" dibuja y puede hacer. */
export interface LoanForm {
  readonly values: LoanFormValues;
  readonly errors: Partial<Record<LoanField, string>>;
  readonly clientLabel: string;
  readonly frequencyLabel: string;
  readonly startDateLabel: string;
  readonly collectorLabel: string;
  readonly totalSuggested: boolean;
  readonly frequencyOptions: typeof FREQUENCY_OPTIONS;
  readonly startDateOptions: readonly { value: string; label: string }[];
  readonly collectorOptions: readonly { value: string; label: string }[];
  readonly sheet: LoanSheet;
  readonly submitting: boolean;
  readonly formError: string | null;
  /** Préstamo ya creado cuyo cobrador no se pudo asignar (no se permite crear otro igual). */
  readonly createdLoanId: string | null;
  readonly openSheet: (sheet: Exclude<LoanSheet, 'none'>) => void;
  readonly closeSheet: () => void;
  readonly setClient: (clientId: string) => void;
  readonly setAmount: (field: 'principal' | 'installment' | 'total', text: string) => void;
  readonly setCount: (text: string) => void;
  readonly setFrequency: (value: string) => void;
  readonly setStartDate: (value: string) => void;
  readonly setCollector: (value: string) => void;
  readonly submit: () => void;
}

function initialValues(clientId: string): LoanFormValues {
  return { clientId, principal: '', count: '', installment: '', total: '', frequency: '', startDate: businessDateOf(), collectorId: '' };
}

/**
 * Lógica de "Nuevo préstamo". El **total a pagar se sugiere** (cuotas × valor de la cuota) mientras la persona no lo
 * escriba a mano; si lo edita, deja de recalcularse (un préstamo con interés tiene un total distinto). Al crear se asigna
 * el cobrador elegido (opcional): si el préstamo se crea pero la asignación falla, se avisa y se bloquea crear otro igual
 * (se asigna después desde el detalle).
 *
 * @param initialClientId - Cliente precargado (cuando se llega desde su ficha), o vacío.
 * @param onCreated - Se llama con el `id` del préstamo creado para abrir su detalle.
 */
export function useLoanForm(initialClientId: string, onCreated: (loanId: string) => void): LoanForm {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<LoanFormValues>(() => initialValues(initialClientId));
  const [totalTouched, setTotalTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<LoanField, string>>>({});
  const [sheet, setSheet] = useState<LoanSheet>('none');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdLoanId, setCreatedLoanId] = useState<string | null>(null);
  const members = useMembers();
  const names = useClientNames(useMemo(() => (values.clientId === '' ? [] : [values.clientId]), [values.clientId]));
  const dates = useMemo(() => startDateOptions(businessDateOf()), []);
  const collectors = useMemo(
    () => (members.data ?? []).filter((member) => member.status === 'ACTIVE' && member.roles.includes('COLLECTOR')).map((member) => ({ value: member.id, label: member.fullName })),
    [members.data],
  );

  const update = (patch: Partial<LoanFormValues>, field: LoanField | null, recalc = false) => {
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

  const finish = (loanId: string) => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'loans'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'client-loans'] });
    onCreated(loanId);
  };

  return {
    values,
    errors,
    clientLabel: values.clientId === '' ? 'Elige un cliente' : (names.get(values.clientId) ?? 'Cliente'),
    frequencyLabel: FREQUENCY_OPTIONS.find((option) => option.value === values.frequency)?.label ?? 'Elige la frecuencia',
    startDateLabel: dates.find((option) => option.value === values.startDate)?.label ?? values.startDate,
    collectorLabel: collectors.find((option) => option.value === values.collectorId)?.label ?? 'Sin asignar por ahora',
    totalSuggested: !totalTouched && values.total !== '',
    frequencyOptions: FREQUENCY_OPTIONS,
    startDateOptions: dates,
    collectorOptions: collectors,
    sheet,
    submitting,
    formError,
    createdLoanId,
    openSheet: setSheet,
    closeSheet: () => {
      setSheet('none');
    },
    setClient: (clientId) => {
      update({ clientId }, 'clientId');
      setSheet('none');
    },
    setAmount: (field, text) => {
      if (field === 'total') setTotalTouched(true);
      update({ [field]: formatAmountInput(text) }, field, field !== 'total');
    },
    setCount: (text) => {
      update({ count: text.replaceAll(/\D/g, '') }, 'count', true);
    },
    setFrequency: (value) => {
      update({ frequency: value as LoanFormValues['frequency'] }, 'frequency');
      setSheet('none');
    },
    setStartDate: (value) => {
      update({ startDate: value }, 'startDate');
      setSheet('none');
    },
    setCollector: (value) => {
      update({ collectorId: value }, null);
      setSheet('none');
    },
    submit: () => {
      if (submitting || createdLoanId !== null) return;
      const validation = validateLoanForm(values);
      if (!validation.ok) {
        setErrors(validation.errors);
        setFormError('Revisa los campos marcados en rojo antes de continuar.');
        return;
      }
      void (async () => {
        setSubmitting(true);
        setErrors({});
        setFormError(null);
        const created = await createLoan(validation.body);
        if (!created.ok) {
          setSubmitting(false);
          signOutIfSessionExpired(created.failure);
          setFormError(loanFailureMessage(created.failure));
          return;
        }
        if (values.collectorId !== '') {
          const assigned = await assignCollector(created.value.id, values.collectorId);
          if (!assigned.ok) {
            setSubmitting(false);
            setCreatedLoanId(created.value.id);
            setFormError('El préstamo se creó, pero no pudimos asignarle el cobrador. Asígnalo desde el detalle del préstamo.');
            return;
          }
        }
        setSubmitting(false);
        finish(created.value.id);
      })();
    },
  };
}
