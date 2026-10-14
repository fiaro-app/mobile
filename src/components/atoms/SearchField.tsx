import { Ionicons } from '@expo/vector-icons';
import { TextInput, View, type TextInputProps } from 'react-native';

/**
 * Campo de búsqueda (44 px, esquinas de 12) con lupa. Es un campo aparte de `TextField` porque su
 * forma es distinta (más redondo, borde gris, ícono) y no tiene estado de error.
 */
export function SearchField(props: Readonly<TextInputProps>) {
  return (
    <View className="h-11 flex-row items-center gap-2 rounded-md border border-skeleton bg-surface px-3.5">
      <Ionicons name="search" size={18} color="#1C1B2E" />
      <TextInput
        accessibilityRole="search"
        placeholderTextColorClassName="accent-foreground/60"
        selectionColorClassName="accent-primary"
        returnKeyType="search"
        autoCorrect={false}
        className="h-full flex-1 font-sans text-label text-foreground outline-none"
        {...props}
      />
    </View>
  );
}
