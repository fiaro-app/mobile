import type { ApiFailure } from '@/lib/http/failure';

/** Textos de la foto del cliente y del comprobante de un pago. */
export const ATTACHMENT_COPY = {
  clientPhoto: {
    title: 'Foto del cliente',
    description: 'La ven solo quienes administran el negocio y el cobrador de este cliente.',
    alt: (name: string) => `Foto de ${name}`,
    none: 'Todavía no hay foto.',
  },
  paymentProof: {
    title: 'Comprobante del pago',
    description: 'La captura de Nequi o de la transferencia.',
    alt: 'Comprobante del pago',
    none: 'Este pago no tiene comprobante.',
  },
  loading: 'Cargando imagen…',
  loadFailed: 'No pudimos cargar la imagen.',
  retry: 'Reintentar',
  upload: 'Subir imagen',
  change: 'Cambiar imagen',
  remove: 'Quitar imagen',
  saved: 'Imagen guardada.',
  removed: 'Imagen quitada.',
  uploadFailed: 'No pudimos subir la imagen. Inténtalo de nuevo.',
  unreadable: 'No pudimos leer la imagen.',
  removeTitle: '¿Quitar la imagen?',
  removeMessage: 'Se borra del almacenamiento. Puedes subir otra cuando quieras.',
  cancel: 'Cancelar',
  confirmRemove: 'Quitar',
} as const;

/** Mensaje de un fallo del API al ver, subir o quitar una imagen. */
export function attachmentFailureMessage(failure: ApiFailure): string {
  if (failure.kind === 'offline') return 'Sin conexión. Las imágenes se suben solo con internet.';
  if (failure.kind === 'maintenance') return 'Fiaro está en mantenimiento. Intenta más tarde.';
  if (failure.code === 'FORBIDDEN') return 'No tienes permiso para cambiar esta imagen.';
  return ATTACHMENT_COPY.uploadFailed;
}
