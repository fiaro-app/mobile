import { useCallback, useState } from 'react';
import { savePin, declinePin } from '@/features/auth/api/pin-vault';
import { usePinEntry, type PinEntry } from '@/features/auth/hooks/use-pin-entry';
import { useSessionStore } from '@/features/auth/store/session-store';

/** Paso de la creación del PIN: primero se teclea, después se confirma. */
export type PinSetupStep = 'create' | 'confirm';

/** Lo que la pantalla de crear PIN necesita. */
export interface PinSetup {
  readonly step: PinSetupStep;
  readonly entry: PinEntry;
  readonly error: string | null;
  readonly onSkip: () => void;
}

/**
 * Lógica de crear el PIN: el primero se guarda en memoria, el segundo debe coincidir. Si no
 * coincide se vuelve al primer paso con un aviso, en lugar de dejar al cobrador con un PIN que no
 * recuerda. "Ahora no" recuerda la decisión para no volver a ofrecerlo en cada inicio.
 */
export function usePinSetup(): PinSetup {
  const [step, setStep] = useState<PinSetupStep>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pinCreated = useSessionStore((state) => state.pinCreated);
  const dismissOffer = useSessionStore((state) => state.pinOfferDismissed);

  const onComplete = useCallback(
    async (pin: string): Promise<boolean> => {
      if (step === 'create') {
        setFirstPin(pin);
        setStep('confirm');
        return true;
      }
      if (pin !== firstPin) {
        setStep('create');
        setFirstPin('');
        setError('Los PIN no coinciden. Vuelve a intentarlo.');
        return true;
      }
      await savePin(pin);
      pinCreated();
      return false;
    },
    [step, firstPin, pinCreated],
  );
  const entry = usePinEntry(onComplete);
  const { press } = entry;

  return {
    step,
    entry: {
      ...entry,
      press: (digit) => {
        setError(null);
        press(digit);
      },
    },
    error,
    onSkip: () => {
      void declinePin().then(dismissOffer);
    },
  };
}
