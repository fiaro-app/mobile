import { restoreSession, signOut as signOutRemote } from '@/features/auth/api/auth-api';
import { clearPin, hasPin, isPinDeclined, resetPinDeclined } from '@/features/auth/api/pin-vault';
import type { SessionUser } from '@/features/auth/lib/session-user';
import { useSessionStore } from '@/features/auth/store/session-store';
import type { ApiFailure } from '@/lib/http/failure';
import { resetBrandColor } from '@/lib/theme/brand';

/**
 * Restaura la sesión guardada al abrir la app. Devuelve el fallo de red (para mostrar la pantalla
 * de "sin conexión") o `null` si quedó lista. Si la sesión ya no existe en el servidor, el PIN no
 * sirve de nada (protegía una sesión que murió), así que se borra y se vuelve al login.
 */
export async function bootSession(): Promise<ApiFailure | null> {
  const restored = await restoreSession();
  if (!restored.ok) return restored.failure;
  const user = restored.value;
  if (!user) {
    await clearPin();
    useSessionStore.getState().signedOut();
    return null;
  }
  const [pinEnabled, declined] = await Promise.all([hasPin(), isPinDeclined()]);
  useSessionStore.getState().restore({ user, pinEnabled, pinOfferPending: !pinEnabled && !declined });
  return null;
}

/**
 * Registra un inicio de sesión exitoso. Si el dispositivo ya tiene PIN (la misma persona volvió a
 * entrar con contraseña) no se vuelve a ofrecer; si no, y no lo rechazó antes, se ofrece.
 */
export async function completeSignIn(user: SessionUser): Promise<void> {
  const [pinEnabled, declined] = await Promise.all([hasPin(), isPinDeclined()]);
  useSessionStore.getState().signedIn({ user, pinEnabled, pinOfferPending: !pinEnabled && !declined });
}

/** Cierra la sesión (en el servidor si hay red, siempre en el dispositivo) y olvida el PIN. */
export async function completeSignOut(): Promise<void> {
  await signOutRemote();
  await Promise.all([clearPin(), resetPinDeclined()]);
  resetBrandColor();
  useSessionStore.getState().signedOut();
}

/**
 * Borra la sesión del dispositivo cuando el PIN se agotó. No espera al servidor: la persona ya
 * fue rechazada y debe poder ver el login sin demora.
 */
export async function completePinExhausted(): Promise<void> {
  void signOutRemote();
  await resetPinDeclined();
  useSessionStore.getState().signedOut();
}
