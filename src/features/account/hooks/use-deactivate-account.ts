import { useState } from 'react';
import { deactivateAccount } from '@/features/account/api/account-api';
import { completeSignOut } from '@/features/auth/store/session-actions';

/** Lo que la pantalla «Desactivar mi cuenta» dibuja y puede hacer. */
export interface DeactivateAccount {
  readonly password: string;
  readonly passwordError: string | null;
  readonly formError: string | null;
  readonly confirming: boolean;
  readonly submitting: boolean;
  readonly changePassword: (text: string) => void;
  /** Pide confirmar (si escribió la contraseña): desactivar la cuenta es una decisión importante. */
  readonly submit: () => void;
  readonly cancel: () => void;
  readonly confirm: () => void;
}

/**
 * Lógica de desactivar la cuenta propia, como en la web: pide la contraseña, confirma y, si sale bien, cierra la sesión en el
 * teléfono (la del servidor ya murió) y la app vuelve al login sola. Contraseña equivocada se marca en el campo.
 */
export function useDeactivateAccount(): DeactivateAccount {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  return {
    password,
    passwordError,
    formError,
    confirming,
    submitting,
    changePassword: (text) => {
      setPassword(text);
      setPasswordError(null);
      setFormError(null);
    },
    submit: () => {
      if (password === '') {
        setPasswordError('Escribe tu contraseña.');
        return;
      }
      setConfirming(true);
    },
    cancel: () => {
      setConfirming(false);
    },
    confirm: () => {
      if (submitting) return;
      setConfirming(false);
      setSubmitting(true);
      void (async () => {
        const result = await deactivateAccount(password);
        if (result.ok || (result.failure.kind === 'http' && result.failure.status === 401)) {
          await completeSignOut();
          return;
        }
        setSubmitting(false);
        if (result.failure.kind === 'http' && result.failure.code === 'INVALID_PASSWORD') setPasswordError('La contraseña no es correcta.');
        else if (result.failure.kind === 'offline') setFormError('Sin conexión. Revisa tu internet e intenta de nuevo.');
        else setFormError('No pudimos desactivar tu cuenta. Intenta de nuevo.');
      })();
    },
  };
}
