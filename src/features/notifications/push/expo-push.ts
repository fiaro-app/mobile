import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Canal de Android por el que llegan los avisos: Android 13+ solo pide permiso cuando existe al menos uno. */
const CHANNEL_ID = 'default';

function projectIdOf(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

/**
 * Pide permiso y devuelve el token de Expo Push de este teléfono, o `null` si no se puede (y no es un error):
 * - **Web**: no aplica.
 * - **Expo Go en Android**: desde el SDK 53 no soporta push remoto; se necesita una "development build".
 * - **Sin `projectId` de EAS** (`eas init`): Expo no puede emitir el token.
 * - **Permiso negado**: la persona decidió no recibir avisos.
 *
 * `expo-notifications` se carga con `require` aquí adentro (no con `import` arriba) para que en Expo Go/web ni siquiera se cargue: su
 * carga en Expo Go Android imprime errores.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  const projectId = projectIdOf();
  if (!projectId) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- carga diferida a propósito (ver TSDoc)
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: () => Promise.resolve({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Avisos', importance: Notifications.AndroidImportance.DEFAULT });
    }
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return null;
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}
