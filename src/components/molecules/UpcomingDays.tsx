import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/** Un día de la proyección: su nombre, la cifra ya escrita y qué tanto pesa frente al mayor (0 a 1). */
export interface UpcomingDay {
  readonly date: string;
  readonly label: string;
  readonly amount: string;
  readonly ratio: number;
}

export interface UpcomingDaysProps {
  readonly days: readonly UpcomingDay[];
  /** Lo que lee un lector de pantalla del conjunto. */
  readonly label: string;
}

/**
 * Lo que toca cobrar en los próximos días, una fila por día: el día, una barra horizontal proporcional y la cifra. Los días
 * sin nada por cobrar (`ratio` 0) quedan atenuados. Solo dibuja.
 */
export function UpcomingDays({ days, label }: Readonly<UpcomingDaysProps>) {
  return (
    <View accessibilityLabel={label} className="gap-2">
      {days.map((day) => (
        <View key={day.date} className="flex-row items-center gap-3">
          <AppText variant="small" tone={day.ratio === 0 ? 'muted' : 'default'} className="w-28" numberOfLines={1}>
            {day.label}
          </AppText>
          <View accessibilityElementsHidden className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <View className="h-2.5 rounded-full bg-warning" style={{ width: `${Math.round(day.ratio * 100)}%` as `${number}%` }} />
          </View>
          <AppText variant="small" tone={day.ratio === 0 ? 'muted' : 'default'} className="min-w-[72px] text-right">
            {day.amount}
          </AppText>
        </View>
      ))}
    </View>
  );
}
