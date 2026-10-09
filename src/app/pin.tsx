import { PinLockView } from '@/components/organisms/PinLockView';
import { PinTemplate } from '@/components/templates/PinTemplate';
import { usePinUnlock } from '@/features/auth/hooks/use-pin-unlock';

/** Ruta `/pin`: desbloqueo con PIN o huella cuando hay una sesión guardada. */
export default function PinScreen() {
  const unlock = usePinUnlock();
  return (
    <PinTemplate>
      <PinLockView
        name={unlock.name}
        initials={unlock.initials}
        digits={unlock.entry.digits}
        error={unlock.error}
        busy={unlock.entry.busy}
        biometricAvailable={unlock.biometricAvailable}
        onDigit={unlock.entry.press}
        onBackspace={unlock.entry.backspace}
        onBiometrics={unlock.onBiometrics}
        onUsePassword={unlock.onUsePassword}
      />
    </PinTemplate>
  );
}
