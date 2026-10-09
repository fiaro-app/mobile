import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import { postSettlement } from '@/features/settlement/api/settlement-api';
import { SETTLEMENT_COPY, differenceLabel } from '@/features/settlement/content/messages';
import { settlementKey, useDailySummary, useSentSettlement } from '@/features/settlement/hooks/use-settlement-data';
import { buildSubmission, differenceOf, formFromSummary, totalOf, type AmountField, type SettlementForm } from '@/features/settlement/lib/settlement-form';
import type { SettlementStatus } from '@/features/settlement/lib/settlement-schemas';
import { rememberSettlement } from '@/features/settlement/store/settlement-memory';
import { formatAmountInput } from '@/features/visit/lib/amount';
import type { ApiFailure } from '@/lib/http/failure';
import { formatCop } from '@/lib/format-cop';

/** Aviso sobre el estado del cuadre ya enviado. */
export interface SentNotice {
  readonly status: SettlementStatus;
  readonly title: string;
  readonly message: string;
  /** Comentario del prestamista al revisar, si lo dejó. */
  readonly reviewNote: string | null;
}

/** Todo lo que la pantalla "Cuadre del día" dibuja y puede hacer. */
export interface SettlementScreen {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly expectedLabel: string;
  readonly collectedLabel: string;
  readonly differenceText: string;
  /** `true` cuando lo cobrado difiere de lo esperado: la nota pasa a ser obligatoria. */
  readonly needsNote: boolean;
  readonly form: SettlementForm;
  /** `true` si el cuadre está enviado o aprobado: se muestra sin poder editarlo. */
  readonly locked: boolean;
  readonly notice: SentNotice | null;
  readonly noteError: string | null;
  readonly formError: string | null;
  readonly submitting: boolean;
  readonly confirmOpen: boolean;
  readonly submitLabel: string;
  readonly setAmount: (field: AmountField, text: string) => void;
  readonly setNote: (text: string) => void;
  readonly requestSubmit: () => void;
  readonly cancelConfirm: () => void;
  readonly confirmSubmit: () => void;
  readonly retry: () => void;
}

function failureMessage(failure: ApiFailure): string {
  return failure.kind === 'offline' ? SETTLEMENT_COPY.offlineSubmit : SETTLEMENT_COPY.submitFailed;
}

/**
 * Lógica de "Cuadre del día": precarga el formulario con lo que el sistema registró hoy, exige la nota
 * cuando no cuadra, confirma antes de enviar y muestra el estado del cuadre ya enviado. Enviar necesita
 * internet (a diferencia de las visitas no hay cola: el cuadre cierra el día y debe quedar recibido).
 * Un cuadre rechazado se puede corregir y reenviar; uno enviado o aprobado queda de solo lectura.
 */
export function useSettlementScreen(): SettlementScreen {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.user?.id ?? '');
  const summary = useDailySummary();
  const date = summary.data?.date;
  const sent = useSentSettlement(userId, date);

  const [draft, setDraft] = useState<SettlementForm | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const data = summary.data;
  const settlement = sent.data ?? null;
  const form = draft ?? (data ? formFromSummary(data) : { cash: '', nequi: '', transfer: '', note: '' });
  const expected = data?.expectedAmount ?? 0;
  const difference = differenceOf(expected, form);
  const status = settlement?.status ?? null;
  const loading = summary.isPending || (data !== undefined && sent.isPending);

  const edit = (next: SettlementForm) => {
    setDraft(next);
    setNoteError(null);
    setFormError(null);
  };

  const submit = async () => {
    const submission = buildSubmission(expected, form);
    if (!submission.ok) return;
    setSubmitting(true);
    const result = await postSettlement(submission.request);
    setSubmitting(false);
    if (!result.ok) {
      signOutIfSessionExpired(result.failure);
      setFormError(failureMessage(result.failure));
      return;
    }
    await rememberSettlement(userId, result.value.date, result.value.id);
    queryClient.setQueryData(settlementKey(userId, result.value.date), result.value);
    setDraft(null);
  };

  return {
    loading,
    loadFailed: !loading && (data === undefined || sent.isError),
    expectedLabel: formatCop(expected),
    collectedLabel: formatCop(totalOf(form)),
    differenceText: differenceLabel(difference, formatCop(Math.abs(difference))),
    needsNote: difference !== 0,
    form,
    locked: status === 'PENDING' || status === 'APPROVED',
    notice: settlement
      ? { status: settlement.status, ...SETTLEMENT_COPY.status[settlement.status], reviewNote: settlement.reviewNote }
      : null,
    noteError,
    formError,
    submitting,
    confirmOpen,
    submitLabel: status === 'REJECTED' ? SETTLEMENT_COPY.resubmit : SETTLEMENT_COPY.submit,
    setAmount: (field, text) => {
      edit({ ...form, [field]: formatAmountInput(text) });
    },
    setNote: (text) => {
      edit({ ...form, note: text });
    },
    requestSubmit: () => {
      const submission = buildSubmission(expected, form);
      if (submission.ok) setConfirmOpen(true);
      else setNoteError(SETTLEMENT_COPY.errors[submission.error]);
    },
    cancelConfirm: () => {
      setConfirmOpen(false);
    },
    confirmSubmit: () => {
      setConfirmOpen(false);
      void submit();
    },
    retry: () => {
      void summary.refetch();
      void sent.refetch();
    },
  };
}
