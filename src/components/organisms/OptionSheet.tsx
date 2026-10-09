import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';
import type { FilterOption } from '@/components/molecules/FilterBar';

export interface OptionSheetProps<T extends string> {
  readonly visible: boolean;
  readonly title: string;
  readonly options: readonly FilterOption<T>[];
  readonly selected: T;
  readonly onSelect: (value: T) => void;
  readonly onClose: () => void;
}

/**
 * Hoja inferior para elegir una opción (el equivalente móvil de un `<select>`). Es una capa
 * superpuesta DENTRO de la pantalla y no el `Modal` de React Native: `Modal` falla con una
 * advertencia en la vista web de desarrollo y no aporta nada aquí. Para que "atrás" de Android la
 * cierre (en vez de salir de la pantalla) se engancha a `BackHandler` mientras está abierta. Cada
 * opción mide 52 px de alto para tocarse cómodo con el pulgar.
 */
export function OptionSheet<T extends string>({ visible, title, options, selected, onSelect, onClose }: Readonly<OptionSheetProps<T>>) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <View className="absolute inset-0 justify-end">
      <Pressable accessibilityLabel="Cerrar" className="absolute inset-0 bg-foreground/40" onPress={onClose} />
      <View className="rounded-t-lg bg-surface px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <AppText variant="title" accessibilityRole="header" className="mb-2">
          {title}
        </AppText>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: option.value === selected }}
            onPress={() => {
              onSelect(option.value);
              onClose();
            }}
            className="h-[52px] flex-row items-center justify-between border-b border-surface-2 active:opacity-70"
          >
            <AppText variant="body" tone={option.value === selected ? 'primary' : 'default'}>
              {option.label}
            </AppText>
            {option.value === selected ? <Ionicons name="checkmark" size={20} color="#3B3382" /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
