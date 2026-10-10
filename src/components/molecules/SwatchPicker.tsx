import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface SwatchPickerProps {
  readonly swatches: readonly { readonly value: string; readonly label: string }[];
  readonly selected: string;
  readonly onSelect: (value: string) => void;
}

/** Selector de color de marca: círculos de 44 px con el color; el elegido lleva un anillo y una marca. El nombre va como etiqueta accesible. */
export function SwatchPicker({ swatches, selected, onSelect }: Readonly<SwatchPickerProps>) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {swatches.map((swatch) => {
        const active = swatch.value.toUpperCase() === selected.toUpperCase();
        return (
          <Pressable
            key={swatch.value}
            accessibilityRole="button"
            accessibilityLabel={swatch.label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              onSelect(swatch.value);
            }}
            className={`size-11 items-center justify-center rounded-full border-2 ${active ? 'border-foreground' : 'border-transparent'}`}
          >
            <View className="size-9 items-center justify-center rounded-full" style={{ backgroundColor: swatch.value }}>
              {active ? <AppText variant="label" tone="inverse">✓</AppText> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
