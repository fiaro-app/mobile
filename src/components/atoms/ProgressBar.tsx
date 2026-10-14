import { View } from 'react-native';

/** Barra de progreso de 8 px (0–100). Verde por defecto (mide lo ya pagado); roja (`destructive`) cuando mide algo malo, como la mora. Se expone como `progressbar` para lectores de pantalla. */
export function ProgressBar({ percent, label, tone = 'success' }: Readonly<{ percent: number; label: string; tone?: 'success' | 'destructive' }>) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: value }} className="h-2 overflow-hidden rounded-full bg-surface-2">
      <View className={`h-full rounded-full ${tone === 'success' ? 'bg-success' : 'bg-destructive'}`} style={{ width: `${value}%` as `${number}%` }} />
    </View>
  );
}
