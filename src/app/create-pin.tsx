import { PinSetupView } from '@/components/organisms/PinSetupView';
import { PinTemplate } from '@/components/templates/PinTemplate';
import { usePinSetup } from '@/features/auth/hooks/use-pin-setup';

const COPY = {
  create: { title: 'Crea tu PIN', subtitle: 'Elige 4 dígitos para entrar más rápido' },
  confirm: { title: 'Confirma tu PIN', subtitle: 'Escríbelo otra vez' },
} as const;

/** Ruta `/create-pin`: se ofrece una vez tras el primer ingreso en el dispositivo. */
export default function CreatePinScreen() {
  const setup = usePinSetup();
  return (
    <PinTemplate>
      <PinSetupView
        title={COPY[setup.step].title}
        subtitle={COPY[setup.step].subtitle}
        digits={setup.entry.digits}
        error={setup.error}
        busy={setup.entry.busy}
        onDigit={setup.entry.press}
        onBackspace={setup.entry.backspace}
        onSkip={setup.onSkip}
      />
    </PinTemplate>
  );
}
