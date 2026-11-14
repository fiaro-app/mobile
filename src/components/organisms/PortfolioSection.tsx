import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { TextLink } from '@/components/atoms/TextLink';

export interface PortfolioSectionProps {
  readonly items: readonly { readonly id: string; readonly name: string; readonly isDefault: boolean }[];
  readonly texts: { readonly add: string; readonly newName: string; readonly create: string; readonly rename: string; readonly delete: string; readonly cancel: string; readonly defaultBadge: string; readonly save: string };
  readonly editing: { readonly kind: 'none' | 'create' | 'rename' | 'delete'; readonly id?: string };
  /** Aviso cuando el negocio ya tiene el máximo de carteras: reemplaza al botón de agregar. */
  readonly limitMessage?: string | null;
  readonly name: string;
  readonly nameError: string | null;
  readonly busy: boolean;
  readonly onName: (text: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
  readonly onCreate: () => void;
  readonly onRename: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

/** Lista de carteras con renombrar y borrar por fila, y el campo para crear o renombrar. Solo dibuja. */
export function PortfolioSection(props: Readonly<PortfolioSectionProps>) {
  const form = props.editing.kind === 'create' || props.editing.kind === 'rename';
  return (
    <View className="gap-3">
      {props.items.map((item) => (
        <View key={item.id} className="gap-1 border-b border-surface-2 pb-3">
          <View className="flex-row items-center justify-between gap-3">
            <AppText variant="label" className="flex-1" numberOfLines={1}>
              {item.name}
            </AppText>
            {item.isDefault ? <Badge label={props.texts.defaultBadge} kind="primary" /> : null}
          </View>
          <View className="flex-row gap-5">
            <TextLink label={props.texts.rename} onPress={() => { props.onRename(item.id); }} />
            {item.isDefault ? null : <TextLink label={props.texts.delete} onPress={() => { props.onDelete(item.id); }} />}
          </View>
        </View>
      ))}
      {form ? (
        <View className="gap-2">
          <TextField accessibilityLabel={props.texts.newName} placeholder={props.texts.newName} value={props.name} onChangeText={props.onName} invalid={props.nameError !== null} editable={!props.busy} maxLength={120} />
          {props.nameError ? (
            <AppText variant="caption" tone="destructive" accessibilityRole="alert">
              {props.nameError}
            </AppText>
          ) : null}
          <View className="flex-row gap-3">
            <Button label={props.texts.cancel} variant="outline" className="flex-1" onPress={props.onCancel} disabled={props.busy} />
            <Button label={props.editing.kind === 'create' ? props.texts.create : props.texts.save} className="flex-1" onPress={props.onSubmit} loading={props.busy} />
          </View>
        </View>
      ) : null}
      {!form && props.limitMessage ? (
        <AppText variant="small" tone="muted">
          {props.limitMessage}
        </AppText>
      ) : null}
      {!form && !props.limitMessage ? <Button label={props.texts.add} variant="outline" onPress={props.onCreate} /> : null}
    </View>
  );
}
