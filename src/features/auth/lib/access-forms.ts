import { ACCESS_COPY } from '@/features/auth/content/access-messages';
import { toMobileE164 } from '@/features/auth/lib/phone';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/features/auth/schemas/change-password-schema';
import { AUTH_COPY } from '@/features/auth/content/messages';

/** Errores por campo de un formulario (ausente = sin error). */
export type FieldErrors<F extends string> = Partial<Record<F, string>>;

/** Mensaje si la contraseña nueva no cumple el largo del API (8 a 128), o `undefined`. */
export function passwordError(password: string): string | undefined {
  return password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX ? undefined : AUTH_COPY.validation.passwordMin;
}

/** Solo dígitos del código de 6 (quita espacios y letras al escribir). */
export function cleanCode(text: string): string {
  return text.replaceAll(/\D/g, '').slice(0, 6);
}

/** Valida el celular de "recuperar contraseña". */
export function validateRecoveryPhone(phone: string): FieldErrors<'phone'> {
  return toMobileE164(phone) === null ? { phone: AUTH_COPY.validation.phone } : {};
}

/** Valida código y contraseña nueva (con su confirmación) del segundo paso. */
export function validateReset(values: { code: string; newPassword: string; confirmPassword: string }): FieldErrors<'code' | 'newPassword' | 'confirmPassword'> {
  const errors: FieldErrors<'code' | 'newPassword' | 'confirmPassword'> = {};
  if (values.code === '') errors.code = ACCESS_COPY.validation.codeRequired;
  else if (values.code.length !== 6) errors.code = ACCESS_COPY.validation.code;
  const weak = passwordError(values.newPassword);
  if (weak) errors.newPassword = weak;
  if (values.confirmPassword === '') errors.confirmPassword = ACCESS_COPY.validation.repeat;
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = AUTH_COPY.validation.passwordMatch;
  return errors;
}

/** Datos del registro (todo texto, como se escribe). */
export interface RegisterValues {
  readonly fullName: string;
  readonly nationalId: string;
  readonly phone: string;
  readonly contactEmail: string;
  readonly password: string;
  readonly businessName: string;
}

/** Campos del paso 1 (cuenta). */
export type AccountField = 'fullName' | 'nationalId' | 'phone' | 'contactEmail' | 'password';

/** Valida el paso 1: nombre, cédula, celular, correo opcional y contraseña. */
export function validateAccountStep(values: RegisterValues): FieldErrors<AccountField> {
  const errors: FieldErrors<AccountField> = {};
  const name = values.fullName.trim();
  if (name.length < 2 || name.length > 120) errors.fullName = ACCESS_COPY.validation.fullName;
  if (!/^[1-9]\d{2,9}$/.test(values.nationalId.replaceAll(/[\s.,-]/g, ''))) errors.nationalId = ACCESS_COPY.validation.nationalId;
  if (toMobileE164(values.phone) === null) errors.phone = AUTH_COPY.validation.phone;
  const email = values.contactEmail.trim();
  if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contactEmail = ACCESS_COPY.validation.email;
  const weak = passwordError(values.password);
  if (weak) errors.password = weak;
  return errors;
}

/** Valida el paso 2: el nombre del negocio (2 a 120 caracteres). */
export function validateCompanyStep(values: RegisterValues): FieldErrors<'businessName'> {
  const name = values.businessName.trim();
  return name.length >= 2 && name.length <= 120 ? {} : { businessName: ACCESS_COPY.validation.business };
}
