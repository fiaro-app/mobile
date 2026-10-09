import type { SessionUser } from '@/features/auth/lib/session-user';

/**
 * En qué parte de la app está la persona. Es lo único que decide qué pantallas existen
 * (`Stack.Protected` en `src/app/_layout.tsx`), así que cada estado tiene exactamente un grupo
 * de pantallas:
 * - `booting`: restaurando la sesión guardada (se muestra el splash).
 * - `signed-out`: sin sesión → login.
 * - `locked`: hay sesión y PIN, falta desbloquear → pantalla de PIN.
 * - `must-change-password`: contraseña temporal → solo puede cambiarla.
 * - `offer-pin`: primer ingreso en este dispositivo → ofrecer crear un PIN.
 * - `signed-in`: acceso completo.
 */
export type AccessState =
  | 'booting'
  | 'signed-out'
  | 'locked'
  | 'must-change-password'
  | 'offer-pin'
  | 'signed-in';

/** Datos de los que depende el estado de acceso. */
export interface AccessInput {
  readonly ready: boolean;
  readonly user: SessionUser | null;
  readonly pinEnabled: boolean;
  readonly unlocked: boolean;
  readonly pinOfferPending: boolean;
}

/**
 * Deriva el estado de acceso. El orden importa: el PIN protege antes que nada (con la app
 * bloqueada no se ve ni el aviso de contraseña temporal) y la oferta de PIN va después de cambiar
 * la contraseña temporal para no pedir dos cosas a la vez.
 */
export function resolveAccess(input: AccessInput): AccessState {
  if (!input.ready) return 'booting';
  if (!input.user) return 'signed-out';
  if (input.pinEnabled && !input.unlocked) return 'locked';
  if (input.user.mustChangePassword) return 'must-change-password';
  if (input.pinOfferPending) return 'offer-pin';
  return 'signed-in';
}
