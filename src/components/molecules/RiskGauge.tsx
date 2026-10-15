import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

const SEGMENTS = 24;
const SIZE = 96;
const RADIUS = 40;
const SEGMENT_CLASSES = { success: 'bg-success', primary: 'bg-primary', warning: 'bg-warning', destructive: 'bg-destructive' } as const;

export interface RiskGaugeProps {
  /** De 0 a 100. */
  readonly score: number;
  readonly tone: keyof typeof SEGMENT_CLASSES;
  /** Lo que lee un lector de pantalla del medidor. */
  readonly label: string;
}

/**
 * Medidor circular del puntaje de riesgo: un anillo de 24 marcas que se llenan según el puntaje, con la cifra al centro.
 * Sin librerías de dibujo (la app no trae SVG): cada marca es una vista girada. El nivel siempre se escribe aparte.
 */
export function RiskGauge({ score, tone, label }: Readonly<RiskGaugeProps>) {
  const filled = Math.round((Math.min(Math.max(score, 0), 100) / 100) * SEGMENTS);
  return (
    <View accessibilityRole="image" accessibilityLabel={label} style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
      {Array.from({ length: SEGMENTS }, (_, index) => {
        const angle = (index / SEGMENTS) * 2 * Math.PI;
        return (
          <View
            key={index}
            testID={index < filled ? 'risk-mark-filled' : 'risk-mark-empty'}
            className={index < filled ? SEGMENT_CLASSES[tone] : 'bg-surface-2'}
            style={{
              position: 'absolute',
              width: 5,
              height: 12,
              borderRadius: 3,
              transform: [{ translateX: Math.sin(angle) * RADIUS }, { translateY: -Math.cos(angle) * RADIUS }, { rotate: `${String((index / SEGMENTS) * 360)}deg` }],
            }}
          />
        );
      })}
      <AppText variant="title">{String(score)}</AppText>
    </View>
  );
}
