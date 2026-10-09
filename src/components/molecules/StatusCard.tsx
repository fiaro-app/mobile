import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { IconBadge, type BadgeTone } from '@/components/atoms/IconBadge';
import type { Ionicons } from '@expo/vector-icons';

export interface StatusCardProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly tone: BadgeTone;
  readonly title: string;
  readonly message: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly actionLoading?: boolean;
}

/**
 * Tarjeta blanca centrada con ícono, título, mensaje y una acción: la forma de las pantallas que
 * bloquean la app ("Sin conexión", "En mantenimiento", "Actualiza la app"). Sombra suave de 16 px,
 * como en el diseño.
 */
export function StatusCard({ icon, tone, title, message, actionLabel, onAction, actionLoading }: Readonly<StatusCardProps>) {
  return (
    <View className="w-full items-center gap-4 rounded-lg bg-surface p-5 shadow-lg shadow-foreground/15">
      <View className="mt-2">
        <IconBadge icon={icon} tone={tone} />
      </View>
      <AppText variant="title" className="text-center text-[22px]" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" className="text-center">
        {message}
      </AppText>
      <Button label={actionLabel} onPress={onAction} loading={actionLoading} className="mt-2 w-full" />
    </View>
  );
}
