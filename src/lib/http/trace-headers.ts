import * as Crypto from 'expo-crypto';

const sessionId = Crypto.randomUUID();
let screen: string | null = null;

/**
 * Anota la pantalla actual como plantilla de ruta (`/loans/[id]`, sin los grupos `(app)`): así los
 * logs del API se agrupan por pantalla sin llevar ids ni datos de la persona.
 */
export function setCurrentScreen(segments: readonly string[]): void {
  const parts = segments.filter((part) => !part.startsWith('('));
  screen = `/${parts.join('/')}`;
}

/**
 * Cabeceras que el API usa para seguir el recorrido de una persona en sus logs: `X-Session-Id`
 * (un UUID por arranque de la app) y `X-Client-Screen`. No identifican a nadie por sí solas.
 */
export function traceHeaders(): Record<string, string> {
  return { 'x-session-id': sessionId, ...(screen ? { 'x-client-screen': screen } : {}) };
}
