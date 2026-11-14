import { LEGAL_VERSION } from '@/features/auth/lib/consents';
import { toMobileE164 } from '@/features/auth/lib/phone';
import { apiPost } from '@/lib/http/api-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** `POST /auth/request-password-reset`: manda un código al correo de contacto. Responde igual exista o no la cuenta (no revela quién tiene cuenta). */
export function requestPasswordReset(phone: string, turnstileToken?: string): Promise<Result<unknown, ApiFailure>> {
  return apiPost('/auth/request-password-reset', { phoneNumber: toMobileE164(phone) ?? phone, ...(turnstileToken ? { turnstileToken } : {}) }, (body) => body);
}

/** `POST /auth/reset-password`: canjea el código por una contraseña nueva y cierra todas las sesiones de la persona. */
export function resetPassword(input: { phone: string; code: string; newPassword: string }): Promise<Result<unknown, ApiFailure>> {
  return apiPost('/auth/reset-password', { phoneNumber: toMobileE164(input.phone) ?? input.phone, code: input.code, newPassword: input.newPassword }, (body) => body);
}

/** Datos para registrar a un dueño y su negocio. */
export interface RegisterInput {
  readonly phone: string;
  readonly fullName: string;
  readonly password: string;
  readonly nationalId: string;
  readonly businessName: string;
  readonly contactEmail: string;
  /** Si aceptó recibir novedades (opcional); los tres consentimientos obligatorios se envían siempre en `true`. */
  readonly marketingConsent: boolean;
  /** Token de Cloudflare Turnstile; sin él (Turnstile apagado) no se envía. */
  readonly turnstileToken?: string;
}

/** `POST /register`: registra a un dueño y su negocio. NO abre sesión: después hay que iniciarla. El correo vacío no se envía. */
export function registerOwner(input: RegisterInput): Promise<Result<unknown, ApiFailure>> {
  return apiPost(
    '/register',
    {
      phone: toMobileE164(input.phone) ?? input.phone,
      fullName: input.fullName,
      password: input.password,
      nationalId: input.nationalId.replaceAll(/[\s.,-]/g, ''),
      businessName: input.businessName,
      acceptedTerms: true,
      acceptedPrivacy: true,
      acceptedDataResponsibility: true,
      marketingConsent: input.marketingConsent,
      legalVersion: LEGAL_VERSION,
      ...(input.contactEmail === '' ? {} : { contactEmail: input.contactEmail }),
      ...(input.turnstileToken ? { turnstileToken: input.turnstileToken } : {}),
    },
    (body) => body,
  );
}
