import type { CreateLoanBody } from '@/features/loans/api/loans-api';
import { FrequencySchema, type Frequency } from '@/features/loans/lib/loan-schemas';
import { parseAmountInput } from '@/features/visit/lib/amount';

/** Máximo de cuotas de un préstamo; evita errores de digitación como 10.000 cuotas. Igual que el contrato del API. */
export const MAX_INSTALLMENT_COUNT = 1000;

/** Lo que la persona escribe y elige en "Nuevo préstamo". Los montos van como texto con puntos de miles. */
export interface LoanFormValues {
  readonly clientId: string;
  readonly principal: string;
  readonly count: string;
  readonly installment: string;
  readonly total: string;
  readonly frequency: Frequency | '';
  readonly startDate: string;
  /** Cobrador a asignar al crear; vacío = sin asignar todavía. */
  readonly collectorId: string;
}

/** Campos con validación. */
export type LoanField = 'clientId' | 'principal' | 'count' | 'installment' | 'total' | 'frequency' | 'startDate';

/** Total sugerido: cuotas × valor de la cuota. `null` mientras falte alguno (o no sea positivo). */
export function suggestTotal(count: number | null, installment: number | null): number | null {
  if (count === null || installment === null || count < 1 || installment < 1) return null;
  return count * installment;
}

/** Resultado de validar: el cuerpo listo para el API o el mensaje de cada campo con problema. */
export type LoanValidation = { readonly ok: true; readonly body: CreateLoanBody } | { readonly ok: false; readonly errors: Partial<Record<LoanField, string>> };

/** Valida el formulario con las mismas reglas del API y arma `POST /loans`. */
export function validateLoanForm(values: LoanFormValues): LoanValidation {
  const errors: Partial<Record<LoanField, string>> = {};
  const principal = parseAmountInput(values.principal);
  const installment = parseAmountInput(values.installment);
  const total = parseAmountInput(values.total);
  const count = /^\d+$/.test(values.count.trim()) ? Number(values.count) : null;
  const frequency = FrequencySchema.safeParse(values.frequency);

  if (values.clientId === '') errors.clientId = 'Elige el cliente.';
  if (principal === null || principal <= 0) errors.principal = 'Escribe el monto prestado.';
  if (count === null) errors.count = 'Escribe el número de cuotas.';
  else if (count < 1) errors.count = 'Debe ser al menos 1 cuota.';
  else if (count > MAX_INSTALLMENT_COUNT) errors.count = `No puede pasar de ${String(MAX_INSTALLMENT_COUNT)} cuotas.`;
  if (installment === null || installment <= 0) errors.installment = 'Escribe el valor de cada cuota.';
  if (total === null || total <= 0) errors.total = 'Escribe el total a pagar.';
  if (!frequency.success) errors.frequency = 'Elige cada cuánto se cobra.';
  if (values.startDate === '') errors.startDate = 'Elige la fecha de inicio.';

  if (Object.keys(errors).length > 0 || principal === null || count === null || installment === null || total === null || !frequency.success) return { ok: false, errors };
  return {
    ok: true,
    body: { clientId: values.clientId, principalAmount: principal, installmentCount: count, installmentValue: installment, totalPayable: total, frequency: frequency.data, startDate: values.startDate },
  };
}
