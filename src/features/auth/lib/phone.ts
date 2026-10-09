/** Largo de un celular colombiano sin el indicativo. */
const MOBILE_DIGITS = 10;

/**
 * Convierte lo que escribe la persona (`"300 123 4567"`, `"+57 300-123-4567"`) al formato E.164
 * que exige el API (`+573001234567`). Devuelve `null` si no es un celular colombiano (3 seguido
 * de 9 dígitos). Equivale a `toColombianE164` de `@fiaro-app/contracts`, limitado a celulares
 * porque el inicio de sesión no admite fijos; el paquete es privado y aún no está instalado aquí.
 */
export function toMobileE164(input: string): string | null {
  const digits = input.replaceAll(/\D/g, '');
  const national = digits.length === MOBILE_DIGITS + 2 && digits.startsWith('57') ? digits.slice(2) : digits;
  return /^3\d{9}$/.test(national) ? `+57${national}` : null;
}

/**
 * Da formato de lectura (`300 123 4567`) a lo que se va tipeando: descarta lo que no son dígitos,
 * quita un `57` inicial pegado y recorta a 10 dígitos. No valida: un número incompleto queda
 * parcialmente formateado y la validación la hace `toMobileE164`.
 */
export function formatPhoneInput(input: string): string {
  let digits = input.replaceAll(/\D/g, '');
  if (digits.length > MOBILE_DIGITS && digits.startsWith('57')) digits = digits.slice(2);
  digits = digits.slice(0, MOBILE_DIGITS);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(' ');
}
