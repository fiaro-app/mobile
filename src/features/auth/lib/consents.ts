/**
 * Versión de los documentos legales que la persona acepta: la fecha del texto. Debe ser igual a `LEGAL_VERSION` de la web y a
 * `CURRENT_LEGAL_VERSION` del API (si no, el registro responde `P930V`).
 */
export const LEGAL_VERSION = '2026-11-14';

/** Lo que se marca al registrarse: las cuatro primeras son obligatorias; las novedades son opcionales. */
export interface Consents {
  readonly terms: boolean;
  readonly privacy: boolean;
  readonly responsibility: boolean;
  readonly cookies: boolean;
  readonly marketing: boolean;
}

export const EMPTY_CONSENTS: Consents = { terms: false, privacy: false, responsibility: false, cookies: false, marketing: false };

/** Autorizaciones obligatorias que faltan por marcar. */
export function missingConsents(consents: Consents): ('terms' | 'privacy' | 'responsibility' | 'cookies')[] {
  return (['terms', 'privacy', 'responsibility', 'cookies'] as const).filter((key) => !consents[key]);
}
