import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';

/** Botón flotante extendido (52 px) abajo a la derecha, para la acción principal de una lista ("＋ Registrar cobrador"). */
export function Fab({ label, onPress }: Readonly<{ label: string; onPress: () => void }>) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="absolute right-5 h-[52px] flex-row items-center gap-2 rounded-full bg-primary px-5 shadow-lg shadow-foreground/25 active:opacity-80"
      style={{ bottom: insets.bottom + 20 }}
    >
      <Ionicons name="add" size={20} color="#FFFFFF" />
      <AppText variant="label" tone="inverse">
        {label}
      </AppText>
    </Pressable>
  );
}
