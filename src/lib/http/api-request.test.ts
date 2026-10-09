import { apiGet } from '@/lib/http/api-request';

const parseVersion = (body: unknown) => (body as { v: string }).v;

function respond(init: { status: number; body?: unknown; headers?: Record<string, string> }) {
  globalThis.fetch = jest.fn().mockResolvedValue(
    new Response(JSON.stringify(init.body ?? {}), { status: init.status, headers: init.headers }),
  );
}

describe('apiGet', () => {
  it('devuelve el cuerpo parseado', async () => {
    respond({ status: 200, body: { v: '1.2.3' } });
    expect(await apiGet('/mobile/version', parseVersion)).toEqual({ ok: true, value: '1.2.3' });
  });

  it('clasifica el modo mantenimiento', async () => {
    respond({ status: 503, body: { code: 'MAINTENANCE' } });
    expect(await apiGet('/health', parseVersion)).toEqual({ ok: false, failure: { kind: 'maintenance' } });
  });

  it('conserva código, estado y espera de un error HTTP', async () => {
    respond({ status: 429, body: { code: 'RATE_LIMITED' }, headers: { 'retry-after': '12' } });
    expect(await apiGet('/health', parseVersion)).toEqual({
      ok: false,
      failure: { kind: 'http', status: 429, code: 'RATE_LIMITED', retryAfterSeconds: 12 },
    });
  });

  it('un error sin cuerpo JSON queda sin código', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('boom', { status: 500 }));
    expect(await apiGet('/health', parseVersion)).toEqual({
      ok: false,
      failure: { kind: 'http', status: 500, code: null, retryAfterSeconds: null },
    });
  });

  it('un cuerpo que no cumple el esquema es un fallo, no una excepción', async () => {
    respond({ status: 200, body: {} });
    const failing = (): string => {
      throw new Error('inválido');
    };
    expect(await apiGet('/health', failing)).toMatchObject({ ok: false, failure: { code: 'INVALID_RESPONSE' } });
  });

  it('sin respuesta es "offline"', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    expect(await apiGet('/health', parseVersion)).toEqual({ ok: false, failure: { kind: 'offline' } });
  });
});
