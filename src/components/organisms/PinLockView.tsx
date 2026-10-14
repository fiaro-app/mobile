import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Avatar } from '@/components/atoms/Avatar';
import { TextLink } from '@/components/atoms/TextLink';
import { PinDots } from '@/components/molecules/PinDots';
import { PinPad } from '@/components/molecules/PinPad';

export interface PinLockViewProps {
  readonly name: string;
  readonly initials: string;
  readonly digits: string;
  readonly error: string | null;
  readonly busy: boolean;
  readonly biometricAvailable: boolean;
  readonly onDigit: (digit: string) => void;
  readonly onBackspace: () => void;
  readonly onBiometrics: () => void;
  readonly onUsePassword: () => void;
}

/**
 * Pantalla "Login PIN": saluda por el nombre, pide el PIN o la huella y deja volver a celular y
 * contraseña. El PIN incorrecto pinta los puntos de rojo y muestra el aviso (diseño "Login PIN —
 * Error"). Solo dibuja; la verificación está en `usePinUnlock`.
 */
export function PinLockView(props: Readonly<PinLockViewProps>) {
  const { name, initials, digits, error, busy, biometricAvailable, onDigit, onBackspace, onBiometrics, onUsePassword } = props;
  return (
    <>
      <Avatar initials={initials} />
      <View className="mt-4 items-center gap-2">
        <AppText variant="title" accessibilityRole="header">{`Hola, ${name}`}</AppText>
        <AppText variant="small">
          {biometricAvailable ? 'Ingresa tu PIN o usa tu huella' : 'Ingresa tu PIN'}
        </AppText>
      </View>
      <View className="mt-6 items-center gap-3">
        <PinDots length={digits.length} error={error !== null} />
        <View className="h-4">
          {error ? (
            <AppText variant="caption" tone="destructive" accessibilityRole="alert" accessibilityLiveRegion="polite">
              {error}
            </AppText>
          ) : null}
        </View>
      </View>
      <View className="mt-4 w-full">
        <PinPad
          onDigit={onDigit}
          onBackspace={onBackspace}
          onBiometrics={biometricAvailable ? onBiometrics : undefined}
          disabled={busy}
        />
      </View>
      <TextLink label="Usar teléfono y contraseña" onPress={onUsePassword} className="mt-auto" />
    </>
  );
}
