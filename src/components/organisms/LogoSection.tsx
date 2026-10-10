import { Image, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';

export interface LogoSectionProps {
  readonly logoUrl: string | null;
  readonly emptyLabel: string;
  readonly chooseLabel: string;
  readonly removeLabel: string;
  readonly busy: boolean;
  readonly onChoose: () => void;
  readonly onRemove: () => void;
}

/** Vista previa del logo (96 px) y los botones para elegir otro o quitarlo. Sin logo muestra un texto. Solo dibuja. */
export function LogoSection(props: Readonly<LogoSectionProps>) {
  return (
    <View className="gap-3">
      <View className="size-24 items-center justify-center overflow-hidden rounded-md border border-surface-3 bg-surface-2">
        {props.logoUrl ? (
          <Image accessibilityLabel="Logo del negocio" source={{ uri: props.logoUrl }} resizeMode="contain" className="size-24" />
        ) : (
          <AppText variant="caption" tone="muted" className="px-2 text-center">
            {props.emptyLabel}
          </AppText>
        )}
      </View>
      <Button label={props.chooseLabel} variant="outline" onPress={props.onChoose} loading={props.busy} />
      {props.logoUrl ? <Button label={props.removeLabel} variant="danger-outline" onPress={props.onRemove} disabled={props.busy} /> : null}
    </View>
  );
}
