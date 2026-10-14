import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { TextLink } from '@/components/atoms/TextLink';
import { PinDots } from '@/components/molecules/PinDots';
import { PinPad } from '@/components/molecules/PinPad';

export interface PinSetupViewProps {
  readonly title: string;
  readonly subtitle: string;
  readonly digits: string;
  readonly error: string | null;
  readonly busy: boolean;
  readonly onDigit: (digit: string) => void;
  readonly onBackspace: () => void;
  readonly onSkip: () => void;
}

/**
 * Pantalla para crear el PIN (no estaba en el diseño original: el login con PIN la presupone).
 * Reutiliza los puntos y el teclado del login con PIN; el título y el subtítulo cambian entre
 * "crear" y "confirmar". "Ahora no" existe porque el PIN es una comodidad, no un requisito.
 */
export function PinSetupView({ title, subtitle, digits, error, busy, onDigit, onBackspace, onSkip }: Readonly<PinSetupViewProps>) {
  return (
    <>
      <View className="items-center gap-2">
        <AppText variant="brand" tone="primary" accessibilityRole="header">
          Fiaro
        </AppText>
        <AppText variant="title" className="mt-6" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="small" className="text-center">
          {subtitle}
        </AppText>
      </View>
      <View className="mt-6 items-center gap-3">
        <PinDots length={digits.length} error={false} />
        <View className="h-4">
          {error ? (
            <AppText variant="caption" tone="destructive" accessibilityRole="alert" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
        </View>
      </View>
      <View className="mt-4 w-full">
        <PinPad onDigit={onDigit} onBackspace={onBackspace} disabled={busy} />
      </View>
      <TextLink label="Ahora no" onPress={onSkip} className="mt-auto" />
    </>
  );
}
