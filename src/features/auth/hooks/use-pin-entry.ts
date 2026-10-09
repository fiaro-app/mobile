import { useCallback, useState } from 'react';
import { appendDigit, PIN_LENGTH, removeLastDigit } from '@/features/auth/lib/pin-rules';

/** Lo que el teclado numérico necesita para dibujarse y responder. */
export interface PinEntry {
  readonly digits: string;
  readonly busy: boolean;
  readonly press: (digit: string) => void;
  readonly backspace: () => void;
  readonly reset: () => void;
}

/**
 * Lógica del teclado de PIN, sin dibujar nada: acumula dígitos y, al completar `PIN_LENGTH`, llama
 * a `onComplete` UNA vez. Mientras `onComplete` está pendiente (`busy`) ignora las teclas, para que
 * una pulsación apurada no mande dos verificaciones.
 *
 * @param onComplete - Recibe el PIN completo; puede ser asíncrona. Si devuelve `true`, los puntos
 * se limpian al terminar (PIN incorrecto o que no coincide); si no, quedan llenos.
 */
export function usePinEntry(onComplete: (pin: string) => Promise<boolean | void> | boolean | void): PinEntry {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);

  const press = useCallback(
    (digit: string) => {
      if (busy || digits.length >= PIN_LENGTH) return;
      const next = appendDigit(digits, digit);
      setDigits(next);
      if (next.length !== PIN_LENGTH) return;
      setBusy(true);
      void Promise.resolve(onComplete(next)).then((shouldReset) => {
        if (shouldReset) setDigits('');
        setBusy(false);
      });
    },
    [busy, digits, onComplete],
  );

  const backspace = useCallback(() => {
    if (!busy) setDigits((current) => removeLastDigit(current));
  }, [busy]);

  const reset = useCallback(() => {
    setDigits('');
  }, []);

  return { digits, busy, press, backspace, reset };
}
