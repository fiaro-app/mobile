import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

/** Estado que muestra el chip. Es independiente de la lógica: quien lo usa traduce su estado a este. */
export type ChipKind = 'delinquent' | 'late' | 'current' | 'paid';

const KIND_CLASSES: Record<ChipKind, string> = {
  delinquent: 'bg-destructive',
  late: 'bg-warning',
  'current': 'bg-success',
  paid: 'bg-success',
};

const KIND_LABELS: Record<ChipKind, string> = {
  delinquent: 'MORA',
  late: 'ATRASO',
  'current': 'AL DÍA',
  paid: 'PAGADO',
};

/** Pastilla de estado (62×26, esquinas redondas) del diseño: MORA, ATRASO, AL DÍA y PAGADO. */
export function StatusChip({ kind }: Readonly<{ kind: ChipKind }>) {
  return (
    <View className={cn('h-[26px] w-[62px] items-center justify-center rounded-full', KIND_CLASSES[kind])}>
      <AppText variant="caption" tone="inverse">
        {KIND_LABELS[kind]}
      </AppText>
    </View>
  );
}
