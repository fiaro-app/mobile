/**
 * Origen del API. En un teléfono físico `localhost` es el propio teléfono: hay que apuntar a la IP
 * de la máquina en la red local (`EXPO_PUBLIC_API_URL=http://192.168.1.20:3040`). Las variables
 * `EXPO_PUBLIC_*` las incrusta Metro al compilar, así que cambiarla exige reiniciar `expo start`.
 */
export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3040';

/**
 * Esquema de enlace profundo de la app (`scheme` de `app.json`). El API lo exige en la cabecera
 * `expo-origin` de toda petición con sesión y lo compara con `MOBILE_APP_SCHEMES`.
 */
export const APP_SCHEME = 'mobile';

/** Milisegundos que se espera al API antes de tratar la petición como "sin conexión". */
export const REQUEST_TIMEOUT_MS = 10_000;
