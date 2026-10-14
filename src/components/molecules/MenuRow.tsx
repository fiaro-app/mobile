import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface MenuRowProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  /** Texto secundario a la derecha (por ejemplo, el estado). */
  readonly detail?: string;
  readonly onPress: () => void;
}

/** Fila de menú de 52 px: ícono, etiqueta, detalle opcional y la flecha que indica que abre otra pantalla. */
export function MenuRow({ icon, label, detail, onPress }: Readonly<MenuRowProps>) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={detail ? `${label}, ${detail}` : label} onPress={onPress} className="min-h-[52px] flex-row items-center gap-3 bg-surface px-5 active:bg-surface-3">
      <Ionicons name={icon} size={22} color="#3B3382" />
      <AppText variant="body" className="flex-1">
        {label}
      </AppText>
      {detail ? (
        <View className="max-w-[45%]">
          <AppText variant="small" numberOfLines={1}>
            {detail}
          </AppText>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#8A879A" />
    </Pressable>
  );
}
