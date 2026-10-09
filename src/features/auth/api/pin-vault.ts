import * as Crypto from 'expo-crypto';
import { MAX_PIN_ATTEMPTS } from '@/features/auth/lib/pin-rules';
import { secureStorage } from '@/lib/storage/secure-storage';

const KEYS = {
  hash: 'fiaro.pin.hash',
  salt: 'fiaro.pin.salt',
  attempts: 'fiaro.pin.attempts',
  declined: 'fiaro.pin.declined',
} as const;

/** Resultado de comprobar un PIN: correcto, incorrecto (quedan intentos) o agotado (se borró). */
export type PinCheck = 'ok' | 'wrong' | 'exhausted';

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

/** `true` si este dispositivo tiene un PIN guardado. */
export async function hasPin(): Promise<boolean> {
  return (await secureStorage.getItemAsync(KEYS.hash)) !== null;
}

/**
 * Guarda el PIN como hash con sal en el almacén cifrado del sistema, nunca el PIN en claro. Un PIN
 * de 4 dígitos tiene solo 10.000 combinaciones y se adivinaría en segundos con el hash en la mano:
 * la defensa real es el contador de intentos (`MAX_PIN_ATTEMPTS`) y que el hash vive en el
 * Keychain/Keystore, no el hash en sí.
 */
export async function savePin(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await secureStorage.setItemAsync(KEYS.salt, salt);
  await secureStorage.setItemAsync(KEYS.hash, await hashPin(pin, salt));
  await secureStorage.setItemAsync(KEYS.attempts, '0');
  await secureStorage.deleteItemAsync(KEYS.declined);
}

/** Borra el PIN y su contador (cerrar sesión o agotar los intentos). */
export async function clearPin(): Promise<void> {
  await Promise.all(
    [KEYS.hash, KEYS.salt, KEYS.attempts].map((key) => secureStorage.deleteItemAsync(key)),
  );
}

/**
 * Comprueba un PIN. Cada fallo suma al contador; al llegar a `MAX_PIN_ATTEMPTS` el PIN se borra y
 * devuelve `exhausted` (quien llama debe cerrar la sesión local y pedir contraseña).
 */
export async function verifyPin(pin: string): Promise<PinCheck> {
  const [hash, salt] = await Promise.all([
    secureStorage.getItemAsync(KEYS.hash),
    secureStorage.getItemAsync(KEYS.salt),
  ]);
  if (!hash || !salt) return 'exhausted';
  if ((await hashPin(pin, salt)) === hash) {
    await secureStorage.setItemAsync(KEYS.attempts, '0');
    return 'ok';
  }
  const attempts = Number(await secureStorage.getItemAsync(KEYS.attempts)) + 1;
  if (attempts >= MAX_PIN_ATTEMPTS) {
    await clearPin();
    return 'exhausted';
  }
  await secureStorage.setItemAsync(KEYS.attempts, String(attempts));
  return 'wrong';
}

/** Recuerda que la persona eligió "Ahora no" al ofrecerle crear un PIN, para no insistir. */
export async function declinePin(): Promise<void> {
  await secureStorage.setItemAsync(KEYS.declined, '1');
}

/** `true` si la persona ya rechazó crear un PIN en este dispositivo. */
export async function isPinDeclined(): Promise<boolean> {
  return (await secureStorage.getItemAsync(KEYS.declined)) === '1';
}

/** Olvida la decisión de "Ahora no" (al cerrar sesión, otra persona puede usar el teléfono). */
export async function resetPinDeclined(): Promise<void> {
  await secureStorage.deleteItemAsync(KEYS.declined);
}
