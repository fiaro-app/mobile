import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface BellButtonProps {
  readonly label: string;
  /** Cuántas hay sin leer; con cero no se dibuja el globo. */
  readonly unread: number;
  readonly onPress: () => void;
}

/** Campana de 44×44 con un globo rojo del número de avisos sin leer (tope visual "9+"). */
export function BellButton({ label, unread, onPress }: Readonly<BellButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      className="size-11 items-center justify-center rounded-full active:bg-surface-3"
    >
      <Ionicons name="notifications-outline" size={22} color="#1C1B2E" />
      {unread > 0 ? (
        <View className="absolute right-1 top-1 min-w-[18px] items-center rounded-full bg-destructive px-1">
          <AppText variant="caption" tone="inverse" className="text-[10px] leading-[16px]">
            {unread > 9 ? '9+' : String(unread)}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}
