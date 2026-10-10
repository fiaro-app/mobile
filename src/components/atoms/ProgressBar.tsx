import { View } from 'react-native';

/** Barra de progreso de 8 px (0–100). Verde porque mide lo ya pagado. Se expone como `progressbar` para lectores de pantalla. */
export function ProgressBar({ percent, label }: Readonly<{ percent: number; label: string }>) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: value }} className="h-2 overflow-hidden rounded-full bg-surface-2">
      <View className="h-full rounded-full bg-success" style={{ width: `${value}%` as `${number}%` }} />
    </View>
  );
}
