import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = { sm: 'size-8', md: 'size-10', lg: 'size-14' };

/**
 * Círculo con las iniciales de la persona, sobre el color de marca: `lg` 56 px (pantalla de PIN),
 * `md` 40 px (fila de cliente) y `sm` 32 px (barra superior). Las iniciales las calcula quien lo
 * usa: aquí solo se dibujan.
 */
export function Avatar({ initials, size = 'lg' }: Readonly<{ initials: string; size?: AvatarSize }>) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`${SIZE_CLASSES[size]} items-center justify-center rounded-full bg-primary`}
    >
      <AppText variant={size === 'sm' ? 'caption' : 'label'} tone="inverse">
        {initials}
      </AppText>
    </View>
  );
}
