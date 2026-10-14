import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/atoms/AppText';
import { TextLink } from '@/components/atoms/TextLink';
import { addMonths, dayLabel, monthGrid, monthLabel, startOfMonth, WEEKDAY_LETTERS } from '@/lib/calendar';
import { cn } from '@/lib/cn';

export interface DatePickerSheetProps {
  readonly visible: boolean;
  readonly title: string;
  /** Fecha elegida (`AAAA-MM-DD`), o `''` si no hay. */
  readonly value: string;
  /** Hoy en Colombia: el mes con que abre si no hay fecha, y el día marcado. */
  readonly today: string;
  /** Primer y último día que se pueden elegir; los demás salen apagados. */
  readonly min?: string;
  readonly max?: string;
  readonly onSelect: (value: string) => void;
  /** Si llega, muestra «Borrar» para quitar la fecha. */
  readonly onClear?: () => void;
  readonly onClose: () => void;
}

/**
 * Calendario de Fiaro en una hoja inferior (el selector de la web llevado al pulgar): mes con flechas, semanas de lunes
 * a domingo y días de 44 px. Tocar un día lo elige y cierra. Es JavaScript puro, sin el selector nativo: se ve igual en
 * Android, iOS y web y funciona en Expo Go. Como `OptionSheet`, es una capa dentro de la pantalla y "atrás" la cierra.
 */
export function DatePickerSheet(props: Readonly<DatePickerSheetProps>) {
  // Se monta al abrir: así el mes arranca en la fecha elegida (o en hoy) cada vez, sin sincronizarlo con un efecto.
  return props.visible ? <DatePickerPanel {...props} /> : null;
}

function DatePickerPanel({ title, value, today, min, max, onSelect, onClear, onClose }: Readonly<DatePickerSheetProps>) {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(startOfMonth(value || today));

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [onClose]);

  const canGoBack = min === undefined || addMonths(month, -1) >= startOfMonth(min);
  const canGoForward = max === undefined || addMonths(month, 1) <= max;
  const allowed = (day: string) => (min === undefined || day >= min) && (max === undefined || day <= max);
  const weeks = monthGrid(month);
  return (
    <View className="absolute inset-0 justify-end">
      <Pressable accessibilityLabel="Cerrar" className="absolute inset-0 bg-foreground/40" onPress={onClose} />
      <View className="rounded-t-lg bg-surface px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <AppText variant="title" accessibilityRole="header" className="mb-3">
          {title}
        </AppText>
        <View className="mb-2 flex-row items-center justify-between">
          <MonthArrow icon="chevron-back" label="Mes anterior" enabled={canGoBack} onPress={() => { setMonth(addMonths(month, -1)); }} />
          <AppText variant="label">{monthLabel(month)}</AppText>
          <MonthArrow icon="chevron-forward" label="Mes siguiente" enabled={canGoForward} onPress={() => { setMonth(addMonths(month, 1)); }} />
        </View>
        <View className="flex-row">
          {WEEKDAY_LETTERS.map((letter) => (
            <AppText key={letter} variant="caption" tone="muted" className="flex-1 py-1 text-center">
              {letter}
            </AppText>
          ))}
        </View>
        <View className="flex-row flex-wrap">
          {weeks.map((day) => {
            const inMonth = day.startsWith(month.slice(0, 7));
            const enabled = inMonth && allowed(day);
            const selected = day === value;
            return (
              <View key={day} className="w-[14.28%] items-center py-0.5">
                {inMonth ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={dayLabel(day)}
                    accessibilityState={{ selected, disabled: !enabled }}
                    disabled={!enabled}
                    onPress={() => {
                      onSelect(day);
                      onClose();
                    }}
                    className={cn('h-11 w-11 items-center justify-center rounded-full active:opacity-70', selected && 'bg-primary', !selected && day === today && 'border border-primary')}
                  >
                    <AppText variant="body" tone={selected ? 'inverse' : 'default'} className={cn(!enabled && 'opacity-30')}>
                      {String(Number(day.slice(8, 10)))}
                    </AppText>
                  </Pressable>
                ) : (
                  <View className="h-11 w-11" />
                )}
              </View>
            );
          })}
        </View>
        <View className="mt-2 flex-row justify-between py-2">
          {onClear && value !== '' ? (
            <TextLink
              label="Borrar"
              onPress={() => {
                onClear();
                onClose();
              }}
            />
          ) : (
            <View />
          )}
          {allowed(today) ? (
            <TextLink
              label="Hoy"
              onPress={() => {
                onSelect(today);
                onClose();
              }}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function MonthArrow({ icon, label, enabled, onPress }: Readonly<{ icon: 'chevron-back' | 'chevron-forward'; label: string; enabled: boolean; onPress: () => void }>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      className={cn('h-11 w-11 items-center justify-center active:opacity-70', !enabled && 'opacity-30')}
    >
      <Ionicons name={icon} size={22} color="#1C1B2E" />
    </Pressable>
  );
}
