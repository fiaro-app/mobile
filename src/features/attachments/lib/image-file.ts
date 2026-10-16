/** Tipos de imagen que acepta el API para la foto de un cliente o un comprobante. */
export const IMAGE_CONTENT_TYPES = ['image/png', 'image/jpeg'] as const;

/** Tamaño máximo: 5 MB. */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Mensaje si la imagen no sirve (tipo o tamaño), o `null`. Un tamaño desconocido (0) se deja pasar: el servidor lo valida. */
export function validateImage(image: { readonly mimeType: string; readonly size: number }): string | null {
  const type = image.mimeType === 'image/jpg' ? 'image/jpeg' : image.mimeType;
  if (!(IMAGE_CONTENT_TYPES as readonly string[]).includes(type)) return 'La imagen debe ser PNG o JPG.';
  if (image.size > IMAGE_MAX_BYTES) return 'La imagen pesa más de 5 MB. Elige una más liviana.';
  return null;
}

/** Tipo de contenido normalizado para pedir la URL de subida (`image/jpg` → `image/jpeg`). */
export function imageContentType(mimeType: string): 'image/png' | 'image/jpeg' {
  return mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
}
