import { patchLender, requestLogoUploadUrl, uploadToStorage } from '@/features/settings/api/settings-api';
import { settingsFailureMessage } from '@/features/settings/content/messages';
import { SETTINGS_KEY } from '@/features/settings/hooks/use-settings-data';
import { logoContentType, validateLogo } from '@/features/settings/lib/logo-file';
import type { LenderSettings } from '@/features/settings/lib/settings-schemas';
import { pickImage } from '@/lib/files/pick-image';
import { useSaveAction } from '@/lib/hooks/use-save-action';
import { useState } from 'react';

/** Sección "Logo". */
export interface LogoSettings {
  readonly logoUrl: string | null;
  readonly error: string | null;
  readonly notice: string | null;
  readonly busy: boolean;
  readonly confirmingRemove: boolean;
  readonly choose: () => void;
  readonly askRemove: () => void;
  readonly cancelRemove: () => void;
  readonly confirmRemove: () => void;
}

/**
 * Logo del negocio: se elige de la galería (PNG o JPG de hasta 2 MB), se pide una URL firmada, se sube la imagen directo al
 * almacenamiento y se guarda la dirección pública con `PATCH /lender`. Quitarlo guarda `logoUrl: null`. Un fallo del almacenamiento
 * (red, permiso) no es un error del API y tiene su propio mensaje.
 */
export function useLogoSettings(settings: LenderSettings | undefined): LogoSettings {
  const action = useSaveAction(settingsFailureMessage);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const invalidate = [SETTINGS_KEY, ['lender']] as const;
  return {
    logoUrl: settings?.logoUrl ?? null,
    error: uploadError ?? action.error,
    notice: action.notice,
    busy: action.busy,
    confirmingRemove,
    choose: () => {
      void (async () => {
        action.clear();
        setUploadError(null);
        const image = await pickImage();
        if (!image) return;
        const problem = validateLogo(image);
        if (problem) {
          setUploadError(problem);
          return;
        }
        const type = logoContentType(image.mimeType);
        await action.run(
          async () => {
            const url = await requestLogoUploadUrl(type);
            if (!url.ok) return url;
            if (!(await uploadToStorage(url.value.uploadUrl, image.uri, type))) {
              setUploadError('No pudimos subir el logo. Inténtalo de nuevo.');
              return { ok: false as const, failure: { kind: 'offline' as const } };
            }
            return patchLender({ logoUrl: url.value.publicUrl });
          },
          'Logo actualizado.',
          invalidate,
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
      void action.run(() => patchLender({ logoUrl: null }), 'Logo quitado.', invalidate).finally(() => {
        setConfirmingRemove(false);
      });
    },
  };
}
