import type { ChangePasswordFailure, SignInFailure } from '@/features/auth/lib/auth-failure';

/** Textos de las pantallas de acceso. Están aparte para poder revisarlos o traducirlos sin tocar la interfaz. */
export const AUTH_COPY = {
  login: {
    title: 'Inicia sesión',
    subtitle: 'Ingresa con tu número de teléfono',
    phoneLabel: 'Teléfono',
    phonePlaceholder: '300 123 4567',
    secretLabel: 'Contraseña',
    maskedPlaceholder: '••••••••',
    forgot: '¿Olvidaste tu contraseña?',
    submit: 'Iniciar sesión',
  },
  validation: {
    phone: 'Ingresa un celular colombiano válido de 10 dígitos.',
    passwordRequired: 'Ingresa tu contraseña.',
    passwordMin: 'La contraseña debe tener mínimo 15 caracteres.',
    passwordMatch: 'Las contraseñas no coinciden.',
    currentRequired: 'Ingresa tu contraseña actual.',
  },
  changePassword: {
    title: 'Crea tu contraseña',
    subtitle: 'Por seguridad, reemplaza la contraseña temporal',
    currentLabel: 'Contraseña temporal',
    newLabel: 'Nueva contraseña',
    confirmLabel: 'Confirmar contraseña',
    hint: 'Mínimo 15 caracteres. Sirve una frase fácil de recordar, como «la tienda abre a las seis».',
    submit: 'Guardar y continuar',
  },
} as const;

const SIGN_IN_MESSAGES = {
  'invalid-credentials': 'Teléfono o contraseña incorrectos.',
  deactivated: 'Tu cuenta está desactivada. Habla con tu administrador.',
  'rate-limited': 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  offline: 'Sin conexión a internet. Revisa tu conexión e intenta de nuevo.',
  maintenance: 'Estamos en mantenimiento. Vuelve a intentarlo en unos minutos.',
  unknown: 'No pudimos iniciar sesión. Intenta de nuevo.',
} as const;

/** Mensaje que se muestra sobre el formulario cuando el inicio de sesión falla. */
export function signInFailureMessage(failure: SignInFailure): string {
  if (failure.kind === 'locked') {
    const wait = failure.retryAfterMinutes;
    if (wait === null) return 'Demasiados intentos fallidos. Vuelve a intentar más tarde.';
    return `Demasiados intentos fallidos. Vuelve a intentar en ${String(wait)} ${wait === 1 ? 'minuto' : 'minutos'}.`;
  }
  return SIGN_IN_MESSAGES[failure.kind];
}

const CHANGE_PASSWORD_MESSAGES = {
  'wrong-current': 'La contraseña temporal no es correcta.',
  weak: 'Esa contraseña es muy fácil de adivinar. Elige otra más difícil.',
  'invalid-length': 'La contraseña debe tener entre 15 y 128 caracteres.',
  'session-expired': 'Tu sesión venció. Inicia sesión de nuevo.',
  'rate-limited': 'Demasiados intentos. Espera un momento y vuelve a intentar.',
  offline: 'Sin conexión a internet. Revisa tu conexión e intenta de nuevo.',
  maintenance: 'Estamos en mantenimiento. Vuelve a intentarlo en unos minutos.',
  unknown: 'No pudimos guardar la contraseña. Intenta de nuevo.',
} as const;

/** Mensaje que se muestra cuando el cambio de contraseña falla. */
export function changePasswordFailureMessage(failure: ChangePasswordFailure): string {
  return CHANGE_PASSWORD_MESSAGES[failure.kind];
}
