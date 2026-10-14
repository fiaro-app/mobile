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

/**
 * Llave pública (site key) del widget de Cloudflare Turnstile. Sin ella no se muestra el widget ni se exige el token
 * (útil en desarrollo si el API tampoco tiene la llave secreta). Para pruebas: `1x00000000000000000000AA` (siempre pasa).
 */
export const TURNSTILE_SITE_KEY: string | undefined = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY || undefined;

/**
 * Origen con el que el WebView nativo carga el widget. Cloudflare solo emite tokens para los dominios autorizados del
 * widget y el API compara ese `hostname` con `CLOUDFLARE_TURNSTILE_HOSTNAMES`: en producción es el dominio de la web.
 */
export const TURNSTILE_ORIGIN: string = process.env.EXPO_PUBLIC_TURNSTILE_ORIGIN ?? 'http://localhost';
