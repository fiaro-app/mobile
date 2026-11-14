import { toMobileE164 } from '@/features/auth/lib/phone';
import { normalizeNationalId } from '@/features/collectors/lib/collector-schemas';
import type { CreateLoanRequestBody } from '@/features/loan-requests/api/requests-api';
import { validateLoanForm, type LoanFormValues } from '@/features/loans/lib/loan-form';

/** Lo que el cobrador escribe al sugerir un préstamo. */
export interface RequestFormValues {
  readonly nationalId: string;
  readonly fullName: string;
  readonly phone: string;
  readonly occupation: string;
  readonly address: string;
  readonly principal: string;
  readonly count: string;
  readonly installment: string;
  readonly total: string;
  readonly frequency: LoanFormValues['frequency'];
  readonly startDate: string;
}

/** Campos con validación. */
export type RequestField = 'nationalId' | 'fullName' | 'phone' | 'occupation' | 'address' | 'principal' | 'count' | 'installment' | 'total' | 'frequency' | 'startDate';

/** Cédula con la forma que acepta el API (3 a 10 dígitos, sin ceros a la izquierda). */
export function isValidNationalId(value: string): boolean {
  return /^[1-9]\d{2,9}$/.test(normalizeNationalId(value));
}

/** Resultado de validar: el cuerpo listo para el API o el mensaje de cada campo con problema. */
export type RequestValidation = { readonly ok: true; readonly body: CreateLoanRequestBody } | { readonly ok: false; readonly errors: Partial<Record<RequestField, string>> };

/**
 * Valida el formulario con las mismas reglas del API. Los datos del cliente solo se exigen si la cédula es nueva
 * (`isNewClient`); si ya existía, no viajan.
 */
export function validateRequestForm(values: RequestFormValues, isNewClient: boolean): RequestValidation {
  const errors: Partial<Record<RequestField, string>> = {};
  if (!isValidNationalId(values.nationalId)) errors.nationalId = 'Escribe una cédula válida (3 a 10 dígitos).';
  const phone = toMobileE164(values.phone);
  if (isNewClient) {
    if (values.fullName.trim().length < 2) errors.fullName = 'Escribe el nombre completo.';
    if (phone === null) errors.phone = 'Escribe un celular colombiano válido, por ejemplo 300 123 4567.';
    if (values.occupation.trim() === '') errors.occupation = 'Escribe el oficio.';
    if (values.address.trim() === '') errors.address = 'Escribe la dirección.';
  }
  const loan = validateLoanForm({ ...values, clientId: 'cliente', collectorId: '' });
  if (!loan.ok) {
    const { clientId: _ignored, ...rest } = loan.errors;
    Object.assign(errors, rest);
  }
  if (Object.keys(errors).length > 0 || !loan.ok) return { ok: false, errors };
  const { clientId: _client, ...terms } = loan.body;
  return {
    ok: true,
    body: {
      nationalId: normalizeNationalId(values.nationalId),
      ...(isNewClient && phone !== null ? { client: { fullName: values.fullName.trim(), occupation: values.occupation.trim(), phone, address: values.address.trim() } } : {}),
      ...terms,
    },
  };
}
