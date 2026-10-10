import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';

export interface SecretCardProps {
  readonly title: string;
  readonly secret: string;
  readonly hint: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
}

/** Tarjeta que muestra un dato que se entrega UNA sola vez (contraseña temporal) en letra monoespaciada, con un botón para compartirlo. */
export function SecretCard({ title, secret, hint, actionLabel, onAction }: Readonly<SecretCardProps>) {
  return (
    <View className="gap-3 rounded-lg bg-surface p-5">
      <AppText variant="label">{title}</AppText>
      <View className="items-center rounded-md bg-surface-2 py-4">
        <AppText variant="mono" selectable className="text-[20px]">
          {secret}
        </AppText>
      </View>
      <AppText variant="caption" tone="muted">
        {hint}
      </AppText>
      <Button label={actionLabel} onPress={onAction} />
    </View>
  );
}
