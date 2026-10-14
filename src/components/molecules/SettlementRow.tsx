import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface SettlementRowProps {
  readonly name: string;
  readonly detail: string;
  readonly amount: string;
  readonly tone: 'good' | 'warning' | 'bad' | 'neutral';
  /** Etiqueta pequeña bajo la cifra (estado del cuadre). */
  readonly badge?: string;
  readonly onPress?: () => void;
}

const AMOUNT_CLASSES = { good: 'text-success', warning: 'text-warning', bad: 'text-destructive', neutral: '' } as const;

/** Fila de un cuadre: cobrador y detalle a la izquierda; a la derecha la diferencia (en su color) y, si hay, el estado. */
export function SettlementRow({ name, detail, amount, tone, badge, onPress }: Readonly<SettlementRowProps>) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} className="min-h-[68px] flex-row items-center justify-between gap-3 bg-surface px-5 py-3 active:bg-surface-3">
      <View className="flex-1">
        <AppText variant="label" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {detail}
        </AppText>
      </View>
      <View className="items-end">
        <AppText variant="label" className={AMOUNT_CLASSES[tone]}>
          {amount}
        </AppText>
        {badge ? (
          <AppText variant="caption" tone="muted">
            {badge}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
