import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';

export interface ConfirmDialogProps {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly cancelLabel: string;
  readonly confirmLabel: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/**
 * Diálogo de confirmación centrado (320 px) sobre un fondo oscurecido, como "¿Confirmar pago?". Es una capa
 * dentro de la pantalla y no el `Modal` de React Native (da una advertencia en la vista web de desarrollo).
 * Tocar el fondo equivale a cancelar.
 */
export function ConfirmDialog({ visible, title, message, cancelLabel, confirmLabel, onCancel, onConfirm }: Readonly<ConfirmDialogProps>) {
  if (!visible) return null;
  return (
    <View className="absolute inset-0 items-center justify-center px-8">
      <Pressable accessibilityLabel={cancelLabel} className="absolute inset-0 bg-foreground/50" onPress={onCancel} />
      <View accessibilityViewIsModal className="w-full gap-3 rounded-lg bg-surface p-5 shadow-lg shadow-foreground/20">
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        <AppText variant="body">{message}</AppText>
        <View className="mt-2 flex-row gap-3">
          <Button label={cancelLabel} variant="outline" className="flex-1" onPress={onCancel} />
          <Button label={confirmLabel} className="flex-1" onPress={onConfirm} />
        </View>
      </View>
    </View>
  );
}
