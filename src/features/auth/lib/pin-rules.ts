import { PIN_LENGTH } from '@/lib/pin';

export { PIN_LENGTH };

/** Intentos fallidos de PIN antes de borrarlo y exigir de nuevo celular y contraseña. */
export const MAX_PIN_ATTEMPTS = 5;

/** `true` si el texto son exactamente `PIN_LENGTH` dígitos. */
export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${String(PIN_LENGTH)}}$`).test(pin);
}

/**
 * Agrega un dígito al PIN que se está tecleando, sin pasar de `PIN_LENGTH`. Es la regla del teclado
 * numérico, aparte del componente para poder probarla sin dibujar nada.
 */
export function appendDigit(current: string, digit: string): string {
  return current.length >= PIN_LENGTH ? current : `${current}${digit}`;
}

/** Quita el último dígito (la tecla "←"). */
export function removeLastDigit(current: string): string {
  return current.slice(0, -1);
}
