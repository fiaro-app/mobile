import { z } from 'zod';
import { AccountSessionSchema, type AccountSession } from '@/features/account/lib/session-schemas';
import { ProfileResponseSchema, type ProfileChanges, type ProfileResponse } from '@/features/account/lib/profile-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** `PATCH /account/profile`: cambia nombre y/o correo de contacto (cambiar el correo reinicia su verificación). */
export function updateProfile(changes: ProfileChanges): Response<ProfileResponse> {
  return authedRequest('/account/profile', (body) => ProfileResponseSchema.parse(body), { method: 'PATCH', body: changes });
}

/** `POST /account/contact-email/request-verification`: manda el código de 6 dígitos al correo de contacto. */
export function requestEmailVerification(): Response<unknown> {
  return authedRequest('/account/contact-email/request-verification', (body) => body, { method: 'POST', body: {} });
}

/** `POST /account/contact-email/verify`: confirma el correo con el código recibido. */
export function verifyContactEmail(code: string): Response<unknown> {
  return authedRequest('/account/contact-email/verify', (body) => body, { method: 'POST', body: { code } });
}

/** `GET /account/sessions`: las sesiones vigentes de la persona, con su dispositivo y último uso. */
export function fetchSessions(): Response<AccountSession[]> {
  return authedRequest('/account/sessions', (body) => z.array(AccountSessionSchema).parse(body));
}

/** `DELETE /account/sessions/:id`: cierra una sesión puntual (la actual da 409: para salir está "Cerrar sesión"). */
export function revokeSession(id: string): Response<unknown> {
  return authedRequest(`/account/sessions/${id}`, (body) => body, { method: 'DELETE' });
}

/** `POST /auth/revoke-other-sessions`: cierra todas las sesiones salvo la de este teléfono. */
export function revokeOtherSessions(): Response<unknown> {
  return authedRequest('/auth/revoke-other-sessions', (body) => body, { method: 'POST', body: {} });
}

/** `POST /account/deactivate`: desactiva la cuenta propia confirmando con la contraseña (la sesión muere en el servidor). */
export function deactivateAccount(password: string): Response<unknown> {
  return authedRequest('/account/deactivate', (body) => body, { method: 'POST', body: { password } });
}
