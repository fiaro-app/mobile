import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/** Un tramo de la barra. */
export interface BarSegment {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly amount: string;
  readonly tone: 'primary' | 'success' | 'warning' | 'destructive';
}

const BAR_CLASSES = { primary: 'bg-primary', success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive' } as const;

/**
 * Una barra horizontal partida en tramos proporcionales con su leyenda (nombre, cifra y porcentaje). El color no es lo
 * único que distingue un tramo: cada uno está nombrado en la leyenda. Solo dibuja.
 */
export function ProportionBar({ segments, label }: Readonly<{ segments: readonly BarSegment[]; label: string }>) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const share = (value: number) => (total === 0 ? 0 : (value / total) * 100);
  return (
    <View className="gap-3">
      <View accessibilityRole="image" accessibilityLabel={label} className="h-3 flex-row overflow-hidden rounded-full bg-surface-2">
        {segments.map((segment) =>
          segment.value > 0 ? <View key={segment.id} className={BAR_CLASSES[segment.tone]} style={{ width: `${share(segment.value)}%` as `${number}%` }} /> : null,
        )}
      </View>
      <View className="gap-1.5">
        {segments.map((segment) => (
          <View key={segment.id} className="flex-row items-center gap-2">
            <View className={`size-2.5 rounded-full ${BAR_CLASSES[segment.tone]}`} />
            <AppText variant="small" className="flex-1">
              {segment.label}
            </AppText>
            <AppText variant="label">{segment.amount}</AppText>
            <AppText variant="caption" tone="muted" className="w-11 text-right">{`${String(Math.round(share(segment.value)))} %`}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
