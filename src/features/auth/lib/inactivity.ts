/** Tiempo en segundo plano a partir del cual se vuelve a pedir el PIN (1 minuto): suficiente para contestar un mensaje, poco para un teléfono perdido. */
export const LOCK_AFTER_MS = 60_000;

/**
 * Decide si hay que volver a pedir el PIN al regresar a la app.
 *
 * @param backgroundedAt - Cuándo pasó a segundo plano (ms desde 1970), o `null` si no se sabe.
 * @param now - Ahora (ms).
 * @param limitMs - Cuánto puede estar fuera sin pedir el PIN.
 */
export function shouldLock(backgroundedAt: number | null, now: number, limitMs: number = LOCK_AFTER_MS): boolean {
  return backgroundedAt !== null && now - backgroundedAt >= limitMs;
}
