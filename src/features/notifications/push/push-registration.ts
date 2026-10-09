import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken, revokePushToken } from '@/features/notifications/api/notifications-api';
import { getExpoPushToken } from '@/features/notifications/push/expo-push';

const STORAGE_KEY = 'fiaro.push-token';

/**
 * Registra el token de este teléfono para la persona de la sesión (`POST /push-tokens`, idempotente) y lo
 * recuerda para poder desvincularlo al cerrar sesión. Nunca lanza ni molesta: sin token o sin red simplemente
 * no pasa nada y se reintenta la próxima vez que se abra la app.
 */
export async function registerPushForSession(): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;
  const result = await registerPushToken(token);
  if (result.ok) await AsyncStorage.setItem(STORAGE_KEY, token);
}

/**
 * Desvincula el token de la persona que cierra sesión (`POST /push-tokens/revoke`) para que quien use el
 * teléfono después no reciba sus avisos. Debe llamarse ANTES de cerrar la sesión en el servidor (necesita la
 * cookie). Si no hay red, el token queda guardado y el API lo reasigna a quien inicie sesión luego.
 */
export async function releasePushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(STORAGE_KEY);
  if (!token) return;
  const result = await revokePushToken(token);
  if (result.ok) await AsyncStorage.removeItem(STORAGE_KEY);
}
