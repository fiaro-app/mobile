import { useState } from 'react';
import { requestEmailVerification, verifyContactEmail } from '@/features/account/api/account-api';
import { ACCOUNT_COPY, accountFailureMessage } from '@/features/account/content/messages';
import { isValidEmailCode } from '@/features/account/lib/profile-schemas';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** Lo que la sección "Verifica tu correo" necesita. */
export interface EmailVerification {
  /** Hay correo y todavía no está verificado: solo entonces la sección tiene sentido. */
  readonly visible: boolean;
  readonly codeSent: boolean;
  readonly code: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly setCode: (text: string) => void;
  readonly sendCode: () => void;
  readonly verify: () => void;
}

/**
 * Lógica de verificación del correo de contacto: pide el código por correo y lo confirma. Al verificar, la
 * sesión local pasa a "correo verificado" y la sección desaparece.
 */
export function useEmailVerification(): EmailVerification {
  const user = useSessionStore((state) => state.user);
  const userUpdated = useSessionStore((state) => state.userUpdated);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (action: () => Promise<Result<unknown, ApiFailure>>, onOk: () => void) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await action();
    setBusy(false);
    if (result.ok) {
      onOk();
      return;
    }
    signOutIfSessionExpired(result.failure);
    setError(accountFailureMessage(result.failure));
  };

  return {
    visible: Boolean(user?.contactEmail) && user?.contactEmailVerified !== true,
    codeSent,
    code,
    busy,
    error,
    notice,
    setCode: (text) => {
      setError(null);
      setCode(text.replaceAll(/\D/g, ''));
    },
    sendCode: () => {
      void run(requestEmailVerification, () => {
        setCodeSent(true);
        setNotice(ACCOUNT_COPY.codeSent);
      });
    },
    verify: () => {
      if (!isValidEmailCode(code)) {
        setError(accountFailureMessage({ kind: 'http', status: 400, code: 'CONTACT_EMAIL_VERIFICATION_CODE_INVALID', retryAfterSeconds: null }));
        return;
      }
      void run(
        () => verifyContactEmail(code),
        () => {
          if (user) userUpdated({ ...user, contactEmailVerified: true });
        },
      );
    },
  };
}
