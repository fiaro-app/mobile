import type { ApiFailure } from '@/lib/http/failure';

/** Textos de recuperar contraseña y de registro. */
export const ACCESS_COPY = {
  recovery: {
    requestTitle: 'Recupera tu contraseña',
    requestSubtitle: 'Te enviaremos un código al correo de contacto de tu cuenta',
    phone: 'Teléfono',
    phonePlaceholder: '300 123 4567',
    sendCode: 'Enviar código',
    sentTitle: 'Revisa tu correo',
    sentSubtitle: 'Si tu cuenta tiene un correo de contacto, te enviamos un código de 6 dígitos.',
    code: 'Código',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    hint: 'Mínimo 8 caracteres.',
    reset: 'Cambiar contraseña',
    resend: 'Reenviar código',
    resent: 'Te enviamos un código nuevo.',
    noEmail: '¿Tu cuenta no tiene correo? Pídele a tu administrador una contraseña temporal.',
    doneTitle: 'Contraseña cambiada',
    doneSubtitle: 'Ya puedes iniciar sesión con tu nueva contraseña.',
    toLogin: 'Ir a iniciar sesión',
    back: 'Volver',
  },
  register: {
    accountTitle: 'Crea tu cuenta',
    companyTitle: 'Tu negocio',
    accountSubtitle: 'Paso 1 de 2',
    companySubtitle: 'Paso 2 de 2',
    fullName: 'Nombre completo',
    fullNamePlaceholder: 'Ej: Daniel Rojas',
    nationalId: 'Cédula',
    nationalIdPlaceholder: '1.020.304.050',
    phone: 'Teléfono',
    phonePlaceholder: '300 123 4567',
    email: 'Correo de contacto (opcional)',
    emailPlaceholder: 'tu@correo.com',
    secretLabel: 'Contraseña',
    hint: 'Mínimo 8 caracteres.',
    business: 'Nombre de tu financiera',
    businessPlaceholder: 'Ej: Préstamos El Águila',
    next: 'Continuar',
    submit: 'Crear cuenta',
    back: 'Atrás',
    doneTitle: 'Cuenta creada',
    doneSubtitle: 'Inicia sesión con tu celular y tu contraseña.',
    toLogin: 'Ir a iniciar sesión',
  },
  validation: {
    code: 'El código tiene 6 dígitos.',
    codeRequired: 'Escribe el código que te enviamos.',
    repeat: 'Repite la contraseña.',
    fullName: 'Escribe tu nombre completo.',
    nationalId: 'Escribe una cédula válida (3 a 10 dígitos).',
    email: 'Escribe un correo válido, por ejemplo tu@correo.com.',
    business: 'Escribe el nombre de tu financiera (2 a 120 caracteres).',
  },
} as const;

/** Mensaje de un fallo en recuperar contraseña o registro, según el `code` estable del API. */
export function accessFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Vuelve a intentarlo en un rato.';
  switch (failure.code) {
    case 'PASSWORD_RESET_CODE_INVALID':
      return 'El código no es correcto o ya se usó. Pide uno nuevo.';
    case 'PASSWORD_RESET_CODE_EXPIRED':
      return 'El código venció. Pide uno nuevo.';
    case 'PHONE_ALREADY_REGISTERED':
      return 'Ya existe una cuenta con ese celular. Inicia sesión o usa otro número.';
    case 'INVALID_PHONE':
      return 'Ingresa un celular colombiano válido de 10 dígitos.';
    case 'PASSWORD_TOO_WEAK':
      return 'Esa contraseña es muy fácil de adivinar. Elige una más larga o menos común.';
    case 'INVALID_PASSWORD_LENGTH':
      return 'La contraseña debe tener entre 8 y 128 caracteres.';
    case 'RATE_LIMITED':
      return 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.';
    case 'TURNSTILE_FAILED':
      return 'No pudimos verificar que eres una persona. Completa la verificación de nuevo.';
    default:
      return failure.status === 429 ? 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' : 'No pudimos completar la acción. Intenta de nuevo.';
  }
}

/** El widget de seguridad no cargó (sin internet o bloqueado). */
export const TURNSTILE_LOAD_ERROR = 'No pudimos cargar la verificación de seguridad. Revisa tu internet e inténtalo de nuevo.';

/** Se pulsó enviar antes de que la verificación de seguridad terminara. */
export const TURNSTILE_PENDING = 'Completa la verificación de seguridad para continuar.';
