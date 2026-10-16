import { Image, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Alert } from '@/components/molecules/Alert';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';

export interface AttachmentSectionProps {
  readonly title: string;
  readonly description: string;
  readonly alt: string;
  readonly none: string;
  /** Puede subir, cambiar y quitar (quien administra, o el cobrador de ese cobro). */
  readonly canEdit: boolean;
  readonly url: string | null;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly confirmingRemove: boolean;
  readonly onChoose: () => void;
  readonly onAskRemove: () => void;
  readonly onCancelRemove: () => void;
  readonly onConfirmRemove: () => void;
  readonly onReload: () => void;
  readonly labels: {
    readonly loading: string;
    readonly loadFailed: string;
    readonly retry: string;
    readonly upload: string;
    readonly change: string;
    readonly remove: string;
    readonly removeTitle: string;
    readonly removeMessage: string;
    readonly cancel: string;
    readonly confirmRemove: string;
  };
}

/**
 * Una imagen privada con sus tres estados (cargando, error con reintento, vacía) y, si se puede editar, los botones para subir,
 * cambiar o quitar. Solo dibuja: `AttachmentPanel` le da los datos y las acciones.
 */
export function AttachmentSection(props: Readonly<AttachmentSectionProps>) {
  const { title, description, alt, none, canEdit, labels: copy } = props;
  const attachment = { url: props.url, loading: props.loading, loadFailed: props.loadFailed, busy: props.busy, error: props.error, notice: props.notice, confirmingRemove: props.confirmingRemove };
  return (
    <View className="gap-3 rounded-lg bg-surface p-5">
      <View className="gap-1">
        <AppText variant="title">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
      </View>
      {attachment.loading ? (
        <View accessibilityRole="progressbar" accessibilityLabel={copy.loading} className="h-40 w-full rounded-md bg-surface-2" />
      ) : null}
      {attachment.loadFailed ? (
        <View className="gap-2">
          <AppText variant="small">{copy.loadFailed}</AppText>
          <Button label={copy.retry} variant="outline" onPress={props.onReload} />
        </View>
      ) : null}
      {!attachment.loading && !attachment.loadFailed ? (
        attachment.url ? (
          <Image accessibilityLabel={alt} source={{ uri: attachment.url }} resizeMode="contain" className="h-56 w-full rounded-md bg-surface-2" />
        ) : (
          <AppText variant="small" tone="muted">
            {none}
          </AppText>
        )
      ) : null}
      {attachment.error ? <Alert message={attachment.error} /> : null}
      {attachment.notice ? (
        <AppText variant="small" tone="primary">
          {attachment.notice}
        </AppText>
      ) : null}
      {canEdit && !attachment.loading && !attachment.loadFailed ? (
        <View className="gap-2">
          <Button label={attachment.url ? copy.change : copy.upload} variant="outline" onPress={props.onChoose} loading={attachment.busy} />
          {attachment.url ? <Button label={copy.remove} variant="danger-outline" onPress={props.onAskRemove} disabled={attachment.busy} /> : null}
        </View>
      ) : null}
      <ConfirmDialog
        visible={attachment.confirmingRemove}
        title={copy.removeTitle}
        message={copy.removeMessage}
        cancelLabel={copy.cancel}
        confirmLabel={copy.confirmRemove}
        onCancel={props.onCancelRemove}
        onConfirm={props.onConfirmRemove}
        destructive
        busy={attachment.busy}
      />
    </View>
  );
}
