import { API_URL, REQUEST_TIMEOUT_MS } from '@/lib/config';
import { sessionHeaders, type HttpMethod } from '@/lib/http/authed-request';
import { classifyHttpFailure, OFFLINE_FAILURE, type ApiFailure } from '@/lib/http/failure';
import { fail, ok, type Result } from '@/lib/result';

/** Un archivo descargado del API. */
export interface DownloadedFile {
  readonly bytes: Uint8Array;
  readonly filename: string | null;
}

/** Nombre de archivo de una cabecera `Content-Disposition` (`attachment; filename="estadisticas.pdf"`), o `null`. */
export function filenameFrom(disposition: string | null): string | null {
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition ?? '');
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Descarga un archivo (PDF) de una ruta autenticada del API. Es la hermana de `authedRequest` para respuestas que NO son JSON:
 * mismas cabeceras de sesión y misma clasificación de fallos, pero devuelve los bytes y el nombre sugerido. Nunca lanza.
 */
export async function authedDownload(path: string, options: { readonly method?: HttpMethod; readonly body?: unknown } = {}): Promise<Result<DownloadedFile, ApiFailure>> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS * 3);
  try {
    const hasBody = options.body !== undefined;
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: { ...(await sessionHeaders()), ...(hasBody ? { 'content-type': 'application/json' } : {}) },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) return fail(classifyHttpFailure(response.status, null, response.headers.get('retry-after')));
    return ok({ bytes: new Uint8Array(await response.arrayBuffer()), filename: filenameFrom(response.headers.get('content-disposition')) });
  } catch {
    return fail(OFFLINE_FAILURE);
  } finally {
    clearTimeout(timer);
  }
}
