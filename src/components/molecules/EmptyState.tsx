import type { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { IconBadge } from '@/components/atoms/IconBadge';

export interface EmptyStateProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly title: string;
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

/**
 * Estado vacío centrado: círculo con ícono, título en Fraunces y una línea de apoyo. La acción
 * (por ejemplo "Reintentar") es opcional. Sirve para "sin clientes", "sin resultados" y para los
 * fallos de carga dentro de una pantalla, sin tapar la barra superior.
 */
export function EmptyState({ icon, title, message, actionLabel, onAction }: Readonly<EmptyStateProps>) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8 py-12">
      <IconBadge icon={icon} tone="neutral" />
      <AppText variant="title" className="mt-2 text-center" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" tone="muted" className="text-center">
        {message}
      </AppText>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} className="mt-3 w-full" /> : null}
    </View>
  );
}
