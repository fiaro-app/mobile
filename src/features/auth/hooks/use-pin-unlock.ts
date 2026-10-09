import { useCallback, useEffect, useState } from 'react';
import { authenticateWithBiometrics, isBiometricAvailable } from '@/features/auth/api/biometrics';
import { verifyPin } from '@/features/auth/api/pin-vault';
import { usePinEntry, type PinEntry } from '@/features/auth/hooks/use-pin-entry';
import { firstName, initials } from '@/features/auth/lib/names';
import { completePinExhausted, completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

/** Todo lo que la pantalla de PIN necesita: datos de la persona, teclado y acciones. */
export interface PinUnlock {
  readonly name: string;
  readonly initials: string;
  readonly entry: PinEntry;
  readonly error: string | null;
  readonly biometricAvailable: boolean;
  readonly onBiometrics: () => void;
  readonly onUsePassword: () => void;
}

/**
 * Lógica de desbloqueo con PIN o huella. Un PIN incorrecto limpia los puntos y muestra el aviso (que
 * desaparece al teclear de nuevo); al agotar los intentos el PIN se borra y se vuelve al login
 * (`completePinExhausted`). La huella se ofrece sola al abrir la pantalla y con su tecla; si falla
 * o se cancela, queda el PIN.
 */
export function usePinUnlock(): PinUnlock {
  const user = useSessionStore((state) => state.user);
  const unlock = useSessionStore((state) => state.unlock);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const onComplete = useCallback(
    async (pin: string): Promise<boolean> => {
      const check = await verifyPin(pin);
      if (check === 'ok') {
        unlock();
        return false;
      }
      if (check === 'exhausted') {
        await completePinExhausted();
        return false;
      }
      setError('PIN incorrecto. Intenta de nuevo.');
      return true;
    },
    [unlock],
  );
  const entry = usePinEntry(onComplete);
  const { press } = entry;

  const tryBiometrics = useCallback(async () => {
    if (await authenticateWithBiometrics()) unlock();
  }, [unlock]);

  useEffect(() => {
    void isBiometricAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) void tryBiometrics();
    });
  }, [tryBiometrics]);

  return {
    name: firstName(user?.fullName ?? ''),
    initials: initials(user?.fullName ?? ''),
    entry: {
      ...entry,
      press: (digit) => {
        setError(null);
        press(digit);
      },
    },
    error,
    biometricAvailable,
    onBiometrics: () => {
      void tryBiometrics();
    },
    onUsePassword: () => {
      void completeSignOut();
    },
  };
}
