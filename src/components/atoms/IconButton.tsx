import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

export interface IconButtonProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  readonly onPress: () => void;
}

/** Botón de solo ícono de 44×44 px (el mínimo táctil), con su nombre accesible. */
export function IconButton({ icon, label, onPress }: Readonly<IconButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      className="size-11 items-center justify-center rounded-full active:bg-surface-3"
    >
      <Ionicons name={icon} size={22} color="#1C1B2E" />
    </Pressable>
  );
}
