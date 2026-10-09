import { View } from 'react-native';
import { AppText, type TextTone } from '@/components/atoms/AppText';

export interface HistoryRowProps {
  readonly dateLabel: string;
  readonly methodLabel: string | null;
  readonly amountLabel: string;
  readonly outcomeLabel: string;
  readonly outcomeTone: 'success' | 'neutral' | 'alert';
}

const TONES: Record<HistoryRowProps['outcomeTone'], TextTone> = {
  success: 'default',
  neutral: 'muted',
  alert: 'destructive',
};

/**
 * Fila del historial de visitas (60 px): fecha y medio de pago a la izquierda; monto y resultado a la
 * derecha. El resultado "Pagado" va en verde, los fallidos en rojo y los neutros (reprogramada) atenuados.
 */
export function HistoryRow({ dateLabel, methodLabel, amountLabel, outcomeLabel, outcomeTone }: Readonly<HistoryRowProps>) {
  return (
    <View className="h-[60px] flex-row items-center justify-between px-5">
      <View className="gap-0.5">
        <AppText variant="label">{dateLabel}</AppText>
        <AppText variant="caption" className="font-sans">
          {methodLabel ?? '—'}
        </AppText>
      </View>
      <View className="items-end gap-0.5">
        <AppText variant="body" className="font-sans-medium">
          {amountLabel}
        </AppText>
        {outcomeTone === 'success' ? (
          <AppText variant="caption" className="text-success">
            {outcomeLabel}
          </AppText>
        ) : (
          <AppText variant="caption" tone={TONES[outcomeTone]}>
            {outcomeLabel}
          </AppText>
        )}
      </View>
    </View>
  );
}
