export interface ErrorBody {
  readonly code: string | null;
  readonly errorCode: string | null;
}

function text(body: object, key: string): string | null {
  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

/** Lee `code` y `errorCode` del cuerpo de un error del API; si no es JSON, ambos son `null`. */
export async function readErrorBody(response: Response): Promise<ErrorBody> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null) return { code: text(body, 'code'), errorCode: text(body, 'errorCode') };
  } catch {
    return { code: null, errorCode: null };
  }
  return { code: null, errorCode: null };
}
