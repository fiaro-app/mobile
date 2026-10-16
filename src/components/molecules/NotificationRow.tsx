import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

/** Tono de la notificación; define el color del punto. */
export type NotificationRowTone = 'destructive' | 'warning' | 'success' | 'primary';

const DOT_CLASSES: Record<NotificationRowTone, string> = {
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
  primary: 'bg-primary',
};

export interface NotificationRowProps {
  readonly title: string;
  readonly body: string;
  readonly when: string;
  readonly unread: boolean;
  readonly tone: NotificationRowTone;
  readonly onPress: () => void;
  /** Mantener presionada la fila la borra (con confirmación, la pide quien la usa). */
  readonly onLongPress?: () => void;
  readonly longPressHint?: string;
}

/**
 * Fila de la bandeja: punto de color (solo si está sin leer), título, texto y hace cuánto llegó. Las leídas se
 * ven más suaves (sin punto y con el título en peso normal) para que lo pendiente destaque.
 */
export function NotificationRow({ title, body, when, unread, tone, onPress, onLongPress, longPressHint }: Readonly<NotificationRowProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Sin leer. ' : ''}${title}. ${body}. ${when}`}
      accessibilityHint={onLongPress ? longPressHint : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-row gap-3 bg-surface px-5 py-4 active:bg-surface-3"
    >
      <View className="w-2.5 pt-1.5">{unread ? <View className={cn('size-2.5 rounded-full', DOT_CLASSES[tone])} /> : null}</View>
      <View className="flex-1 gap-0.5">
        <AppText variant={unread ? 'label' : 'body'} numberOfLines={2}>
          {title}
        </AppText>
        <AppText variant="small" numberOfLines={3}>
          {body}
        </AppText>
        <AppText variant="caption" tone="muted">
          {when}
        </AppText>
      </View>
    </Pressable>
  );
}
