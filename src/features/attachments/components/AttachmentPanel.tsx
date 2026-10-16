import { AttachmentSection } from '@/components/organisms/AttachmentSection';
import type { AttachmentTarget } from '@/features/attachments/api/attachments-api';
import { ATTACHMENT_COPY } from '@/features/attachments/content/messages';
import { useAttachment } from '@/features/attachments/hooks/use-attachment';

export interface AttachmentPanelProps {
  readonly target: AttachmentTarget;
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly alt: string;
  readonly none: string;
  /** Puede subir, cambiar y quitar (quien administra, o el cobrador de ese cobro). */
  readonly canEdit: boolean;
}

/** Una imagen privada lista para usar en una pantalla: trae la imagen con `useAttachment` y se la pasa a `AttachmentSection`. */
export function AttachmentPanel({ target, id, title, description, alt, none, canEdit }: Readonly<AttachmentPanelProps>) {
  const attachment = useAttachment(target, id);
  return (
    <AttachmentSection
      title={title}
      description={description}
      alt={alt}
      none={none}
      canEdit={canEdit}
      url={attachment.url}
      loading={attachment.loading}
      loadFailed={attachment.loadFailed}
      busy={attachment.busy}
      error={attachment.error}
      notice={attachment.notice}
      confirmingRemove={attachment.confirmingRemove}
      onChoose={attachment.choose}
      onAskRemove={attachment.askRemove}
      onCancelRemove={attachment.cancelRemove}
      onConfirmRemove={attachment.confirmRemove}
      onReload={attachment.reload}
      labels={ATTACHMENT_COPY}
    />
  );
}
