import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** Cómo terminó el intento de compartir. */
export type ShareFileResult = 'shared' | 'unavailable' | 'failed';

/**
 * Guarda los bytes en la caché del teléfono y abre la hoja de compartir del sistema (guardar en Archivos, enviar por WhatsApp,
 * correo...). Nunca lanza: `unavailable` si el dispositivo no puede compartir archivos y `failed` si no se pudo escribir.
 */
export async function shareFile(bytes: Uint8Array, filename: string, mimeType: string): Promise<ShareFileResult> {
  try {
    if (!(await Sharing.isAvailableAsync())) return 'unavailable';
    const file = new File(Paths.cache, filename);
    if (file.exists) file.delete();
    file.create();
    file.write(bytes);
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename });
    return 'shared';
  } catch {
    return 'failed';
  }
}
