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
