import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/** Un día de la gráfica. */
export interface DayBarData {
  readonly date: string;
  readonly label: string;
  readonly collected: number;
  readonly expected: number;
}

const CHART_HEIGHT = 120;

export interface DayBarsProps {
  readonly bars: readonly DayBarData[];
  /** Lo que lee un lector de pantalla del conjunto: el resumen. */
  readonly label: string;
  readonly legendCollected: string;
  readonly legendExpected: string;
  /** `false` en la proyección: solo tiene «lo que vence». */
  readonly showCollected?: boolean;
}

/**
 * Columnas por día: la columna es lo cobrado y una raya ámbar marca lo que vencía según el calendario. Hechas con
 * vistas (sin librería de gráficas): la altura de cada una es proporcional al mayor valor del período. Con muchos días
 * se rotulan solo algunos para que las fechas no se encimen. Solo dibuja.
 */
export function DayBars({ bars, label, legendCollected, legendExpected, showCollected = true }: Readonly<DayBarsProps>) {
  const max = Math.max(1, ...bars.map((bar) => Math.max(bar.collected, bar.expected)));
  const every = Math.max(1, Math.ceil(bars.length / 6));
  const height = (value: number) => Math.round((value / max) * CHART_HEIGHT);
  return (
    <View className="gap-2">
      <View accessibilityRole="image" accessibilityLabel={label} style={{ height: CHART_HEIGHT }} className="flex-row items-end gap-px border-b border-surface-3">
        {bars.map((bar) => (
          <View key={bar.date} className="h-full flex-1 justify-end">
            {showCollected && bar.collected > 0 ? <View className="w-full rounded-t-sm bg-primary" style={{ height: height(bar.collected) }} /> : null}
            {bar.expected > 0 ? <View className="absolute h-[3px] w-full rounded-full bg-warning" style={{ bottom: height(bar.expected) }} /> : null}
          </View>
        ))}
      </View>
      <View className="flex-row">
        {bars.map((bar, index) => (
          <View key={bar.date} className="flex-1 items-center">
            {index % every === 0 ? (
              <AppText variant="caption" tone="muted" className="w-12 text-center text-[10px]" numberOfLines={1}>
                {bar.label}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap gap-4">
        {showCollected ? (
          <View className="flex-row items-center gap-1.5">
            <View className="size-2.5 rounded-sm bg-primary" />
            <AppText variant="caption" tone="muted">
              {legendCollected}
            </AppText>
          </View>
        ) : null}
        <View className="flex-row items-center gap-1.5">
          <View className="h-[3px] w-4 rounded-full bg-warning" />
          <AppText variant="caption" tone="muted">
            {legendExpected}
          </AppText>
        </View>
      </View>
    </View>
  );
}
