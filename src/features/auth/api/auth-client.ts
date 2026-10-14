import { expoClient } from '@better-auth/expo/client';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { API_URL, APP_SCHEME } from '@/lib/config';
import { secureStorage } from '@/lib/storage/secure-storage';

/** Prefijo con el que `expoClient` nombra sus claves: `fiaro_cookie` y `fiaro_session_data`. */
export const STORAGE_PREFIX = 'fiaro';

/**
 * Cliente de better-auth, el mismo motor que usa el API. `expoClient` hace tres cosas que en
 * móvil no vienen gratis: guarda la cookie de sesión en el almacén cifrado, la reenvía en cada
 * petición (React Native no tiene "jar" de cookies) y manda `expo-origin` con el esquema de la app,
 * que el API compara con `MOBILE_APP_SCHEMES`.
 *
 * `cookiePrefix` debe ser el del API (`SESSION_COOKIE_PREFIX = 'fiaro'`): con otro, el cliente no
 * reconoce la cookie de sesión y nunca la guarda.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/auth',
  plugins: [
    expoClient({
      scheme: APP_SCHEME,
      storagePrefix: STORAGE_PREFIX,
      cookiePrefix: 'fiaro',
      storage: secureStorage,
    }),
    phoneNumberClient(),
  ],
});
