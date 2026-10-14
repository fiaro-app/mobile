/** Tipos de imagen que acepta el API para el logo. */
export const LOGO_CONTENT_TYPES = ['image/png', 'image/jpeg'] as const;

/** Tamaño máximo del logo (2 MB). */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Mensaje si la imagen no sirve de logo (tipo o tamaño), o `null`. Un tamaño desconocido (0) se deja pasar: el servidor lo valida. */
export function validateLogo(image: { readonly mimeType: string; readonly size: number }): string | null {
  const type = image.mimeType === 'image/jpg' ? 'image/jpeg' : image.mimeType;
  if (!(LOGO_CONTENT_TYPES as readonly string[]).includes(type)) return 'El logo debe ser una imagen PNG o JPG.';
  if (image.size > LOGO_MAX_BYTES) return 'El logo pesa más de 2 MB. Elige una imagen más liviana.';
  return null;
}

/** Tipo de contenido normalizado para pedir la URL de subida (`image/jpg` → `image/jpeg`). */
export function logoContentType(mimeType: string): 'image/png' | 'image/jpeg' {
  return mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
}
