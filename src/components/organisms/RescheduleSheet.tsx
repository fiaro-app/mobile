import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { SelectButton } from '@/components/atoms/SelectButton';
import type { FilterOption } from '@/components/molecules/FilterBar';
import { OptionSheet } from '@/components/organisms/OptionSheet';

export interface RescheduleSheetProps {
  readonly visible: boolean;
  readonly title: string;
  readonly subtitle: string;
  readonly dateLabel: string;
  readonly hint: string;
  readonly cancelLabel: string;
  readonly saveLabel: string;
  readonly options: readonly FilterOption<string>[];
  readonly selected: string;
  readonly onSelect: (value: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
}

/**
 * Hoja "Reprogramar visita": elegir la fecha de compromiso (obligatoria: el API la exige con este
 * resultado, a diferencia del diseño original que la marcaba opcional) y guardar. La fecha se elige de
 * una lista de los próximos días, que evita un selector de calendario nativo y fechas pasadas.
 */
export function RescheduleSheet(props: Readonly<RescheduleSheetProps>) {
  const insets = useSafeAreaInsets();
  const [listOpen, setListOpen] = useState(false);
  if (!props.visible) return null;
  const current = props.options.find((option) => option.value === props.selected)?.label ?? props.dateLabel;
  return (
    <View className="absolute inset-0 justify-end">
      <Pressable accessibilityLabel={props.cancelLabel} className="absolute inset-0 bg-foreground/40" onPress={props.onCancel} />
      <View className="gap-4 rounded-t-lg bg-surface px-6 pt-6" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="gap-0.5">
          <AppText variant="body" className="font-sans-semibold" accessibilityRole="header">
            {props.title}
          </AppText>
          <AppText variant="caption" tone="muted" className="font-sans">
            {props.subtitle}
          </AppText>
        </View>
        <View className="gap-1.5">
          <AppText variant="caption">{props.dateLabel}</AppText>
          <SelectButton
            label={current}
            active
            onPress={() => {
              setListOpen(true);
            }}
          />
          <AppText variant="caption" tone="muted" className="font-sans">
            {props.hint}
          </AppText>
        </View>
        <View className="flex-row gap-3">
          <Button label={props.cancelLabel} variant="outline" className="flex-1" onPress={props.onCancel} />
          <Button label={props.saveLabel} className="flex-[2]" onPress={props.onSave} />
        </View>
      </View>
      <OptionSheet
        visible={listOpen}
        title={props.dateLabel}
        options={props.options}
        selected={props.selected}
        onSelect={props.onSelect}
        onClose={() => {
          setListOpen(false);
        }}
      />
    </View>
  );
}
