import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Almacén clave-valor cifrado. En web (solo para desarrollo) cae a `localStorage`. */
export type SecureStorage = Pick<
  typeof SecureStore,
  'getItem' | 'getItemAsync' | 'setItem' | 'setItemAsync' | 'deleteItemAsync'
>;

const webStorage: SecureStorage = {
  getItem: (key) => globalThis.localStorage?.getItem(key) ?? null,
  getItemAsync: (key) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
  setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
  setItemAsync: (key, value) => Promise.resolve(globalThis.localStorage?.setItem(key, value)),
  deleteItemAsync: (key) => Promise.resolve(globalThis.localStorage?.removeItem(key)),
};

/**
 * Dónde se guardan la cookie de sesión y el PIN. En iOS usa el Keychain y en Android el Keystore
 * (`expo-secure-store`). `expo-secure-store` no existe en web, y el navegador solo se usa para ver
 * la interfaz durante el desarrollo, así que allí se usa `localStorage`, que NO es seguro: nunca
 * se publica un build web.
 */
export const secureStorage: SecureStorage = Platform.OS === 'web' ? webStorage : SecureStore;
