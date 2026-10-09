import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/**
 * Círculo de 56 px con las iniciales de la persona, sobre el color de marca (el avatar de la
 * pantalla de PIN). Las iniciales las calcula quien lo usa: aquí solo se dibujan.
 */
export function Avatar({ initials }: Readonly<{ initials: string }>) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="size-14 items-center justify-center rounded-full bg-primary"
    >
      <AppText variant="label" tone="inverse">
        {initials}
      </AppText>
    </View>
  );
}
