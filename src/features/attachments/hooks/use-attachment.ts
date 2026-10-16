import { useState } from 'react';
import { deleteAttachment, fetchAttachmentUrl, requestAttachmentUploadUrl, saveAttachment, type AttachmentTarget } from '@/features/attachments/api/attachments-api';
import { ATTACHMENT_COPY, attachmentFailureMessage } from '@/features/attachments/content/messages';
import { imageContentType, IMAGE_MAX_BYTES, validateImage } from '@/features/attachments/lib/image-file';
import { readImageBlob, uploadToStorage } from '@/features/settings/api/settings-api';
import { pickImage } from '@/lib/files/pick-image';
import { useApiQuery } from '@/lib/hooks/use-api-query';
import { useSaveAction } from '@/lib/hooks/use-save-action';

/** Todo lo que una imagen privada dibuja y puede hacer. */
export interface Attachment {
  readonly url: string | null;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly confirmingRemove: boolean;
  readonly choose: () => void;
  readonly askRemove: () => void;
  readonly cancelRemove: () => void;
  readonly confirmRemove: () => void;
  readonly reload: () => void;
}

/**
 * Una imagen privada (foto de cliente, comprobante): se trae con su URL firmada, se elige de la galería (PNG o JPG de hasta 5 MB),
 * se pide una URL de subida, se sube directo al almacenamiento y se guarda. Un fallo del almacenamiento (red, permiso) no es un
 * error del API y tiene su propio mensaje.
 */
export function useAttachment(target: AttachmentTarget, id: string): Attachment {
  const key = ['attachment', target, id] as const;
  const query = useApiQuery(key, () => fetchAttachmentUrl(target, id));
  const action = useSaveAction(attachmentFailureMessage);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  return {
    url: query.data ?? null,
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    busy: action.busy,
    error: uploadError ?? action.error,
    notice: action.notice,
    confirmingRemove,
    choose: () => {
      void (async () => {
        action.clear();
        setUploadError(null);
        const image = await pickImage();
        if (!image) return;
        const problem = validateImage(image);
        if (problem) {
          setUploadError(problem);
          return;
        }
        const type = imageContentType(image.mimeType);
        const blob = await readImageBlob(image.uri);
        if (!blob || blob.size < 1 || blob.size > IMAGE_MAX_BYTES) {
          setUploadError(blob ? validateImage({ ...image, size: blob.size }) ?? ATTACHMENT_COPY.unreadable : ATTACHMENT_COPY.unreadable);
          return;
        }
        await action.run(
          async () => {
            const upload = await requestAttachmentUploadUrl(target, id, type, blob.size);
            if (!upload.ok) return upload;
            if (!(await uploadToStorage(upload.value.uploadUrl, blob, type))) {
              setUploadError(ATTACHMENT_COPY.uploadFailed);
              return { ok: false as const, failure: { kind: 'offline' as const } };
            }
            return saveAttachment(target, id, upload.value.key);
          },
          ATTACHMENT_COPY.saved,
          [key],
        );
      })();
    },
    askRemove: () => {
      action.clear();
      setUploadError(null);
      setConfirmingRemove(true);
    },
    cancelRemove: () => {
      setConfirmingRemove(false);
    },
    confirmRemove: () => {
      void action.run(() => deleteAttachment(target, id), ATTACHMENT_COPY.removed, [key]).finally(() => {
        setConfirmingRemove(false);
      });
    },
    reload: () => {
      void query.refetch();
    },
  };
}
