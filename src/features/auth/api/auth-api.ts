import { authClient, STORAGE_PREFIX } from '@/features/auth/api/auth-client';
import { toSessionUser, type SessionUser } from '@/features/auth/lib/session-user';
import { classifyHttpFailure, OFFLINE_FAILURE, type ApiFailure } from '@/lib/http/failure';
import { fail, ok, type Result } from '@/lib/result';
import { secureStorage } from '@/lib/storage/secure-storage';

/** Forma común de la respuesta de better-auth: o hay datos o hay un error con estado y código. */
interface AuthResponse {
  readonly data: unknown;
  readonly error: { readonly status?: number; readonly code?: string } | null;
}

/**
 * Ejecuta una llamada al cliente de better-auth y la convierte en `Result`. better-auth no lanza
 * en errores HTTP (devuelve `{ error }`), pero una caída de red sí puede lanzar: ambos casos se
 * normalizan. `retryAfter` lo captura la propia llamada desde las cabeceras (el objeto `error` no
 * las trae).
 */
async function run(
  call: (capture: (header: string | null) => void) => Promise<AuthResponse>,
): Promise<Result<unknown, ApiFailure>> {
  let retryAfter: string | null = null;
  try {
    const { data, error } = await call((header) => {
      retryAfter = header;
    });
    if (!error) return ok(data);
    if (!error.status) return fail(OFFLINE_FAILURE);
    return fail(classifyHttpFailure(error.status, error.code, retryAfter));
  } catch {
    return fail(OFFLINE_FAILURE);
  }
}

function userFrom(data: unknown): Result<SessionUser, ApiFailure> {
  try {
    const body = data as { user: unknown };
    return ok(toSessionUser(body.user));
  } catch {
    return fail(classifyHttpFailure(200, 'INVALID_RESPONSE'));
  }
}

/**
 * Inicia sesión con celular (E.164) y contraseña (`POST /auth/sign-in/phone-number`). La cookie
 * queda guardada por `expoClient`.
 */
export async function signInWithPhone(phone: string, password: string): Promise<Result<SessionUser, ApiFailure>> {
  const response = await run((capture) =>
    authClient.signIn.phoneNumber({
      phoneNumber: phone,
      password,
      fetchOptions: {
        onError: (context) => {
          capture(context.response.headers.get('retry-after'));
        },
      },
    }),
  );
  return response.ok ? userFrom(response.value) : response;
}

/**
 * Recupera la sesión guardada (`GET /auth/get-session`). `ok(null)` significa que no hay sesión
 * vigente (nunca hubo, venció o la revocaron), que no es un error.
 */
export async function restoreSession(): Promise<Result<SessionUser | null, ApiFailure>> {
  const response = await run(() => authClient.getSession());
  if (!response.ok) return response;
  return response.value ? userFrom(response.value) : ok(null);
}

/**
 * Cambia la contraseña (`POST /auth/change-password`). El API revoca las demás sesiones y responde
 * con una cookie nueva, que `expoClient` guarda en lugar de la anterior.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<Result<SessionUser, ApiFailure>> {
  const response = await run(() => authClient.changePassword({ currentPassword, newPassword }));
  return response.ok ? userFrom(response.value) : response;
}

/**
 * Cierra la sesión. Intenta revocarla en el servidor, pero SIEMPRE borra la cookie local: sin
 * conexión no se puede avisar al API, y aun así la persona debe poder salir de su teléfono.
 */
export async function signOut(): Promise<void> {
  await run(() => authClient.signOut());
  await Promise.all(
    [`${STORAGE_PREFIX}_cookie`, `${STORAGE_PREFIX}_session_data`].map((key) =>
      secureStorage.setItemAsync(key, '{}'),
    ),
  );
}
