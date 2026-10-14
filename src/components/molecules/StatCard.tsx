import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

const VALUE_CLASSES = { neutral: '', good: 'text-success', warning: 'text-warning', bad: 'text-destructive' } as const;

export interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  /** Tendencia frente al período anterior ("↑ 12 %"), coloreada según mejore o empeore. */
  readonly trend?: { readonly label: string; readonly tone: 'neutral' | 'good' | 'warning' | 'bad' } | null;
  /** Resalta la cifra en rojo (lo vencido). Atajo de `tone="bad"`. */
  readonly alert?: boolean;
  /** Color de la cifra según su intención (verde bueno, ámbar aviso, rojo malo). */
  readonly tone?: 'neutral' | 'good' | 'warning' | 'bad';
  readonly className?: string;
}

/** Tarjeta de una cifra: etiqueta pequeña, valor grande en la fuente de títulos y una ayuda opcional. */
export function StatCard({ label, value, hint, trend, alert = false, tone = 'neutral', className }: Readonly<StatCardProps>) {
  return (
    <View className={cn('gap-1 rounded-md border border-surface-3 bg-surface px-4 py-3', className)}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="title" className={VALUE_CLASSES[alert ? 'bad' : tone]}>
        {value}
      </AppText>
      {trend ? (
        <AppText variant="caption" className={VALUE_CLASSES[trend.tone]}>
          {`${trend.label} vs. período anterior`}
        </AppText>
      ) : null}
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
