import { Share } from 'react-native';

/** Abre la hoja de compartir del sistema (WhatsApp, mensajes...) con un texto. Nunca lanza: si la persona cancela o falla, no pasa nada. */
export async function shareText(message: string): Promise<void> {
  try {
    await Share.share({ message });
  } catch {
    return;
  }
}
