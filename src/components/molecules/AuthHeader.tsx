import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface AuthHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}

/**
 * Cabecera de las pantallas de acceso: la marca "Fiaro" en Fraunces, el título y la línea de apoyo,
 * centrados. Los espacios (33 y 11 px) son los medidos en el diseño de Penpot.
 */
export function AuthHeader({ title, subtitle }: Readonly<AuthHeaderProps>) {
  return (
    <View className="items-center">
      <AppText variant="brand" tone="primary" accessibilityRole="header">
        Fiaro
      </AppText>
      <AppText variant="title" className="mt-8 text-center" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="small" className="mt-3 text-center">
        {subtitle}
      </AppText>
    </View>
  );
}
