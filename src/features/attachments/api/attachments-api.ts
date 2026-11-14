import { z } from 'zod';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** Lo que se adjunta: la foto de un cliente o el comprobante de un pago (D-145 del API). */
export type AttachmentTarget = 'client' | 'payment';

const BASE: Record<AttachmentTarget, (id: string) => string> = {
  client: (id) => `/clients/${id}/photo`,
  payment: (id) => `/payments/${id}/proof`,
};

/** `GET .../photo|proof`: la URL firmada para ver la imagen (vence en minutos), o `null` si no hay. */
export function fetchAttachmentUrl(target: AttachmentTarget, id: string): Response<string | null> {
  return authedRequest(BASE[target](id), (body) => z.object({ url: z.string().nullable() }).parse(body).url);
}

/** `POST .../upload-url`: URL firmada para subir directo al almacenamiento; firma el tipo y el peso EXACTOS (hasta 5 MB). */
export function requestAttachmentUploadUrl(target: AttachmentTarget, id: string, contentType: 'image/png' | 'image/jpeg', sizeBytes: number): Response<{ uploadUrl: string; key: string }> {
  return authedRequest(`${BASE[target](id)}/upload-url`, (body) => z.object({ uploadUrl: z.string(), key: z.string() }).parse(body), { method: 'POST', body: { contentType, sizeBytes } });
}

/** `POST .../photo|proof`: guarda la imagen ya subida (el API comprueba que de verdad es PNG o JPEG). */
export function saveAttachment(target: AttachmentTarget, id: string, key: string): Response<unknown> {
  return authedRequest(BASE[target](id), (body) => body, { method: 'POST', body: { key } });
}

/** `DELETE .../photo|proof`: quita la imagen; repetirlo no falla. */
export function deleteAttachment(target: AttachmentTarget, id: string): Response<unknown> {
  return authedRequest(BASE[target](id), (body) => body, { method: 'DELETE' });
}
