import type { ApiFailure } from '@/lib/http/failure';

/** Textos de "Perfil" y "Editar perfil". */
export const ACCOUNT_COPY = {
  profileTitle: 'Perfil',
  editTitle: 'Editar perfil',
  nameLabel: 'Nombre completo',
  emailLabel: 'Correo de contacto',
  emailHint: 'Lo usamos para recuperar tu contraseña y enviarte avisos. Es opcional.',
  save: 'Guardar cambios',
  saved: 'Cambios guardados.',
  nothingToSave: 'No hay cambios por guardar.',
  verifyTitle: 'Verifica tu correo',
  verifyMessage: 'Te enviaremos un código de 6 dígitos para confirmar que el correo es tuyo.',
  sendCode: 'Enviar código',
  resendCode: 'Reenviar código',
  codeSent: 'Te enviamos un código. Revisa tu correo.',
  codeLabel: 'Código de 6 dígitos',
  verify: 'Verificar',
  verified: 'Correo verificado',
  notVerified: 'Sin verificar',
  noEmail: 'Sin correo',
} as const;

/** Mensaje para un fallo al actualizar el perfil o verificar el correo, según el `code` estable del API. */
export function accountFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Intenta de nuevo cuando tengas internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  switch (failure.code) {
    case 'CONTACT_EMAIL_NOT_SET':
      return 'Primero agrega un correo de contacto.';
    case 'CONTACT_EMAIL_ALREADY_VERIFIED':
      return 'Tu correo ya está verificado.';
    case 'CONTACT_EMAIL_VERIFICATION_CODE_INVALID':
      return 'El código no es correcto. Revísalo e inténtalo de nuevo.';
    case 'CONTACT_EMAIL_VERIFICATION_CODE_EXPIRED':
      return 'El código venció. Pide uno nuevo.';
    default:
      return failure.status === 429 ? 'Demasiados intentos. Espera un momento.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}
