import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';
import { IconButton } from '@/components/atoms/IconButton';

export interface TopBarProps {
  readonly title: string;
  /** Si se pasa, muestra la flecha "←" a la izquierda. */
  readonly onBack?: () => void;
  /** Contenido a la derecha (íconos, avatar). */
  readonly right?: ReactNode;
}

/**
 * Barra superior blanca de 64 px más la zona segura de la muesca. El título es Fraunces; la flecha
 * de volver solo existe en pantallas que se abren encima de otra (Mis clientes).
 */
export function TopBar({ title, onBack, right }: Readonly<TopBarProps>) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-row items-center bg-surface px-3" style={{ paddingTop: insets.top, height: 64 + insets.top }}>
      {onBack ? <IconButton icon="arrow-back" label="Volver" onPress={onBack} /> : <View className="w-2" />}
      <AppText variant="title" accessibilityRole="header" className="flex-1" numberOfLines={1}>
        {title}
      </AppText>
      {right}
    </View>
  );
}
