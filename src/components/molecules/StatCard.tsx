import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  /** Resalta la cifra en rojo (lo vencido). */
  readonly alert?: boolean;
  readonly className?: string;
}

/** Tarjeta de una cifra: etiqueta pequeña, valor grande en la fuente de títulos y una ayuda opcional. */
export function StatCard({ label, value, hint, alert = false, className }: Readonly<StatCardProps>) {
  return (
    <View className={cn('gap-1 rounded-md border border-foreground/10 bg-surface px-4 py-3', className)}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="title" tone={alert ? 'destructive' : 'default'}>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
