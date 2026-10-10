import * as ImagePicker from 'expo-image-picker';

/** Imagen elegida de la galería. */
export interface PickedImage {
  readonly uri: string;
  readonly mimeType: string;
  readonly size: number;
}

/**
 * Abre la galería para elegir UNA imagen (sin recorte ni edición: el logo se sube tal cual). Devuelve `null` si la persona cancela o
 * niega el permiso. Nunca lanza.
 */
export async function pickImage(): Promise<PickedImage | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return null;
    return { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg', size: asset.fileSize ?? 0 };
  } catch {
    return null;
  }
}
