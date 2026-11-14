import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { RiskGauge, type RiskGaugeProps } from '@/components/molecules/RiskGauge';

export interface RiskCardProps {
  readonly title: string;
  readonly levelLabel: string;
  readonly gauge: RiskGaugeProps;
  /** Una frase por factor. */
  readonly factors: readonly string[];
  readonly noFactors: string;
  /** Sin historial no hay medidor: solo este texto. */
  readonly noHistory: string | null;
}

/** Tarjeta de riesgo de la ficha del cliente: medidor, nivel y lo que lo explica. Solo dibuja. */
export function RiskCard({ title, levelLabel, gauge, factors, noFactors, noHistory }: Readonly<RiskCardProps>) {
  return (
    <View className="gap-3 rounded-lg bg-surface p-5">
      <AppText variant="title">{title}</AppText>
      {noHistory ? (
        <AppText variant="small" tone="muted">
          {noHistory}
        </AppText>
      ) : (
        <View className="flex-row items-center gap-5">
          <RiskGauge {...gauge} />
          <View className="flex-1 gap-1.5">
            <AppText variant="label" tone={gauge.tone === 'destructive' ? 'destructive' : 'default'} className="capitalize">
              {levelLabel}
            </AppText>
            {factors.length === 0 ? (
              <AppText variant="small" tone="muted">
                {noFactors}
              </AppText>
            ) : (
              factors.map((factor) => (
                <AppText key={factor} variant="small">{`• ${factor}`}</AppText>
              ))
            )}
          </View>
        </View>
      )}
    </View>
  );
}
