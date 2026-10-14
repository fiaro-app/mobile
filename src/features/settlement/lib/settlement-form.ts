import type { DailySummary, SettlementRequest } from '@/features/settlement/lib/settlement-schemas';
import { formatAmountInput, parseAmountInput } from '@/features/visit/lib/amount';

/** Lo que la persona ve y edita: un texto por medio de pago (con puntos de miles) y la nota. */
export interface SettlementForm {
  readonly cash: string;
  readonly nequi: string;
  readonly transfer: string;
  readonly note: string;
}

/** Campos de monto del formulario. */
export type AmountField = 'cash' | 'nequi' | 'transfer';

/** Máximo de la nota; el API la rechaza si pasa de 500 caracteres. */
export const NOTE_MAX_LENGTH = 500;

/** Precarga el formulario con lo que el sistema ya registró hoy: casi siempre el cobrador solo confirma. */
export function formFromSummary(summary: DailySummary): SettlementForm {
  const text = (amount: number) => formatAmountInput(String(amount));
  return { cash: text(summary.collectedByMethod.CASH), nequi: text(summary.collectedByMethod.NEQUI), transfer: text(summary.collectedByMethod.TRANSFER), note: '' };
}

/** Suma lo cobrado en los tres medios; un campo vacío cuenta como cero. */
export function totalOf(form: SettlementForm): number {
  return (parseAmountInput(form.cash) ?? 0) + (parseAmountInput(form.nequi) ?? 0) + (parseAmountInput(form.transfer) ?? 0);
}

/** Cobrado menos esperado: negativo es faltante, positivo es sobrante. */
export function differenceOf(expected: number, form: SettlementForm): number {
  return totalOf(form) - expected;
}

/** Por qué el cuadre no se puede enviar. */
export type SettlementError = 'note-required' | 'note-too-long';

/** Resultado de armar el envío: la petición lista o el motivo por el que falta algo. */
export type Submission = { readonly ok: true; readonly request: SettlementRequest } | { readonly ok: false; readonly error: SettlementError };

/**
 * Arma `POST /daily-settlements`. Si lo cobrado difiere de lo esperado la nota es obligatoria (el API la
 * exige también); si coincide, la nota es opcional y una en blanco se envía como `null`.
 *
 * @param expected - Lo esperado del día, tal como lo calculó el API.
 */
export function buildSubmission(expected: number, form: SettlementForm): Submission {
  const note = form.note.trim();
  if (note.length > NOTE_MAX_LENGTH) return { ok: false, error: 'note-too-long' };
  if (differenceOf(expected, form) !== 0 && note === '') return { ok: false, error: 'note-required' };
  return {
    ok: true,
    request: {
      expectedAmount: expected,
      collectedCash: parseAmountInput(form.cash) ?? 0,
      collectedNequi: parseAmountInput(form.nequi) ?? 0,
      collectedTransfer: parseAmountInput(form.transfer) ?? 0,
      collectorNote: note === '' ? null : note,
    },
  };
}
