import { formatCop } from '@/lib/format-cop';

/** Convierte lo que escribe la persona (`"35.000"`, `"$ 35000"`) en pesos enteros, o `null` si no hay dígitos. */
export function parseAmountInput(text: string): number | null {
  const digits = text.replaceAll(/\D/g, '');
  return digits === '' ? null : Number(digits);
}

/** Da formato de miles a lo que se va tecleando (`"35000"` → `"35.000"`); sin dígitos devuelve cadena vacía. */
export function formatAmountInput(text: string): string {
  const amount = parseAmountInput(text);
  return amount === null ? '' : amount.toLocaleString('es-CO');
}

/** Por qué un monto no se puede registrar. */
export type AmountError = 'required' | 'over-balance';

/**
 * Valida el monto de un pago: debe ser mayor que cero y no superar el saldo del préstamo (cobrar más de
 * lo que se debe cerraría el préstamo con un saldo negativo; el API lo rechazaría de todos modos).
 */
export function validateAmount(amount: number | null, balance: number): AmountError | null {
  if (amount === null || amount <= 0) return 'required';
  return amount > balance ? 'over-balance' : null;
}

/** Mensaje de un error de monto. */
export function amountErrorMessage(error: AmountError, balance: number): string {
  return error === 'required' ? 'Ingresa un monto mayor a cero.' : `El monto no puede superar el saldo (${formatCop(balance)}).`;
}

/** `full` si el pago cubre la cuota; `partial` si es menor. */
export type PaymentKind = 'full' | 'partial';

/** Clasifica el pago frente a la cuota de hoy; define si el texto de confirmación dice "completo" o "parcial". */
export function paymentKind(amount: number, installment: number): PaymentKind {
  return amount >= installment ? 'full' : 'partial';
}
