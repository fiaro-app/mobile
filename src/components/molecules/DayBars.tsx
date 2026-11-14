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
  /** Leyenda del color de los días que llegaron a la meta. */
  readonly legendReached: string;
}

/**
 * Columnas por día: una barra ancha y clara con lo que tocaba cobrar (la meta del día según el calendario) y, encima, una
 * angosta de color con lo que se cobró: verde si llegó a la meta, azul si se quedó corto. Hechas con vistas (sin librería
 * de gráficas): la altura de cada una es proporcional al mayor valor del período. Con muchos días se rotulan solo algunos
 * para que las fechas no se encimen. Solo dibuja.
 */
export function DayBars({ bars, label, legendCollected, legendExpected, legendReached }: Readonly<DayBarsProps>) {
  const max = Math.max(1, ...bars.map((bar) => Math.max(bar.collected, bar.expected)));
  const every = Math.max(1, Math.ceil(bars.length / 6));
  const height = (value: number) => Math.round((value / max) * CHART_HEIGHT);
  return (
    <View className="gap-2">
      <View accessibilityRole="image" accessibilityLabel={label} style={{ height: CHART_HEIGHT }} className="flex-row items-end gap-px border-b border-surface-3">
        {bars.map((bar) => (
          <View key={bar.date} className="h-full flex-1 items-center justify-end">
            {bar.expected > 0 ? <View className="absolute bottom-0 w-full rounded-t-sm bg-surface-3" style={{ height: height(bar.expected) }} /> : null}
            {bar.collected > 0 ? <View className={bar.expected > 0 && bar.collected >= bar.expected ? 'w-1/2 rounded-t-sm bg-success' : 'w-1/2 rounded-t-sm bg-primary'} style={{ height: height(bar.collected) }} /> : null}
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
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-sm bg-surface-3" />
          <AppText variant="caption" tone="muted">
            {legendExpected}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-sm bg-primary" />
          <AppText variant="caption" tone="muted">
            {legendCollected}
          </AppText>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="size-2.5 rounded-sm bg-success" />
          <AppText variant="caption" tone="muted">
            {legendReached}
          </AppText>
        </View>
      </View>
    </View>
  );
}
