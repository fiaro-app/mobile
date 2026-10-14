import * as Crypto from 'expo-crypto';

/**
 * Identificador de una visita, generado en el teléfono. Es la llave de idempotencia del API (D-29): se
 * crea UNA vez al abrir el formulario y se reutiliza al reintentar el mismo envío, de modo que un reintento
 * tras una conexión perdida nunca duplica el cobro.
 */
export function newVisitId(): string {
  return Crypto.randomUUID();
}
