import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useSessionStore } from '@/features/auth/store/session-store';
import { useClientDetail } from '@/features/client-detail/hooks/use-client-detail';
import type { ClientDetailModel } from '@/features/client-detail/lib/detail-view-model';
import { confirmMessage, VISIT_COPY } from '@/features/visit/content/messages';
import { amountErrorMessage, formatAmountInput, parseAmountInput, paymentKind, validateAmount } from '@/features/visit/lib/amount';
import { rescheduleOptions, type DateOption } from '@/features/visit/lib/reschedule-dates';
import { submitVisit, type SubmitOutcome } from '@/features/visit/lib/submit-visit';
import { newVisitId } from '@/features/visit/lib/visit-id';
import { paidVisit, rescheduledVisit, unpaidVisit, type Method, type NoPaymentOutcome, type VisitRequest } from '@/features/visit/lib/visit-request';
import { businessDateOf } from '@/lib/business-date';
import { formatCop } from '@/lib/format-cop';

/** Cómo terminó un registro exitoso: enviada o guardada en el teléfono, y si llevaba pago. */
export interface VisitDone {
  readonly kind: 'sent' | 'queued';
  readonly paid: boolean;
}

/** Hoja abierta sobre el formulario. */
export type VisitSheet = 'none' | 'outcome' | 'reschedule';

/** Todo lo que la pantalla de registrar visita dibuja y puede hacer. */
export interface RegisterVisit {
  readonly ready: boolean;
  /** `true` si el cliente no se pudo cargar (sin datos que mostrar). */
  readonly loadFailed: boolean;
  readonly model: ClientDetailModel | null;
  readonly balanceLabel: string;
  readonly amountText: string;
  readonly amountError: string | null;
  readonly method: Method;
  readonly submitting: boolean;
  readonly formError: string | null;
  readonly confirmOpen: boolean;
  readonly confirmText: string;
  readonly sheet: VisitSheet;
  readonly dateOptions: DateOption[];
  readonly rescheduleDate: string;
  readonly setAmount: (text: string) => void;
  readonly setMethod: (method: Method) => void;
  readonly requestConfirm: () => void;
  readonly cancelConfirm: () => void;
  readonly confirmPayment: () => void;
  readonly openOutcomeSheet: () => void;
  readonly closeSheet: () => void;
  readonly chooseOutcome: (outcome: NoPaymentOutcome | 'RESCHEDULED') => void;
  readonly setRescheduleDate: (value: string) => void;
  readonly saveReschedule: () => void;
}

function interpret(outcome: SubmitOutcome): { done: VisitDone | null; error: string | null } {
  if (outcome.kind === 'rejected') return { done: null, error: VISIT_COPY.rejected };
  if (outcome.kind === 'session-expired') return { done: null, error: VISIT_COPY.sessionExpired };
  return { done: { kind: outcome.kind, paid: false }, error: null };
}

/**
 * Lógica de "Registrar visita": monto editable (precargado con la cuota), medio de pago, confirmación del
 * pago y las otras salidas (no lo encontré, se negó, reprogramar con fecha obligatoria: el API la exige).
 *
 * El `id` de la visita se genera al abrir y se conserva para reintentar el mismo envío sin duplicarlo; se
 * renueva solo si el API rechaza la visita (no quedó guardada y los datos pueden cambiar). Al terminar bien
 * se invalidan la ruta y el detalle para que muestren el nuevo saldo.
 *
 * @param clientId - Cliente de la visita.
 * @param loanId - Préstamo visitado.
 * @param onDone - Se llama cuando la visita quedó enviada o guardada, para ir a la confirmación.
 */
export function useRegisterVisit(clientId: string, loanId: string, onDone: (done: VisitDone) => void): RegisterVisit {
  const detail = useClientDetail(clientId, loanId);
  const user = useSessionStore((state) => state.user);
  const queryClient = useQueryClient();
  const model = detail.model;
  const balance = model?.balance ?? 0;

  const [visitId, setVisitId] = useState(newVisitId);
  const [amountText, setAmountText] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>('CASH');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // `submitting` es estado y no se actualiza hasta el próximo render: un doble toque entra dos veces.
  const inFlight = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheet, setSheet] = useState<VisitSheet>('none');
  const dateOptions = rescheduleOptions(businessDateOf());
  const [rescheduleDate, setRescheduleDate] = useState(dateOptions[0]?.value ?? '');

  const shownAmount = amountText ?? (model ? formatAmountInput(String(model.installmentValue)) : '');
  const amount = parseAmountInput(shownAmount);

  const send = async (request: VisitRequest, paid: boolean) => {
    if (!user || !model || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);
    const outcome = await submitVisit({ userId: user.id, loanId, clientName: model.name, request });
    inFlight.current = false;
    setSubmitting(false);
    const result = interpret(outcome);
    if (!result.done) {
      setFormError(result.error);
      if (outcome.kind === 'rejected') setVisitId(newVisitId());
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ['collector', 'route'] });
    void queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
    onDone({ ...result.done, paid });
  };

  const requestConfirm = () => {
    const error = validateAmount(amount, balance);
    setAmountError(error ? amountErrorMessage(error, balance) : null);
    if (!error) setConfirmOpen(true);
  };

  const methodLabel = VISIT_COPY.methods.find((option) => option.value === method)?.label ?? '';
  const kind = model && amount !== null ? paymentKind(amount, model.installmentValue) : 'full';

  return {
    ready: model !== null,
    loadFailed: model === null && detail.state !== 'loading',
    model,
    balanceLabel: formatCop(balance),
    amountText: shownAmount,
    amountError,
    method,
    submitting,
    formError,
    confirmOpen,
    confirmText: confirmMessage(formatCop(amount ?? 0), methodLabel, kind, model?.name ?? ''),
    sheet,
    dateOptions,
    rescheduleDate,
    setAmount: (text) => {
      setAmountText(formatAmountInput(text));
      setAmountError(null);
      setFormError(null);
    },
    setMethod,
    requestConfirm,
    cancelConfirm: () => {
      setConfirmOpen(false);
    },
    confirmPayment: () => {
      setConfirmOpen(false);
      if (amount !== null) void send(paidVisit(visitId, amount, method), true);
    },
    openOutcomeSheet: () => {
      setSheet('outcome');
    },
    closeSheet: () => {
      setSheet('none');
    },
    chooseOutcome: (outcome) => {
      if (outcome === 'RESCHEDULED') {
        setSheet('reschedule');
        return;
      }
      setSheet('none');
      void send(unpaidVisit(visitId, outcome), false);
    },
    setRescheduleDate,
    saveReschedule: () => {
      setSheet('none');
      void send(rescheduledVisit(visitId, rescheduleDate), false);
    },
  };
}
