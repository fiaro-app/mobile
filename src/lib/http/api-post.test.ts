import { apiPost } from '@/lib/http/api-request';

const respond = (status: number, body: unknown = {}, headers: Record<string, string> = {}) => {
  globalThis.fetch = jest.fn().mockResolvedValue(new Response(body === null ? null : JSON.stringify(body), { status, headers }));
};
const parse = (body: unknown) => (body as { v: number } | null)?.v ?? -1;

describe('apiPost', () => {
  it('envía JSON y devuelve lo interpretado', async () => {
    respond(200, { v: 5 });
    expect(await apiPost('/x', { a: 1 }, parse)).toEqual({ ok: true, value: 5 });
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/x');
    expect(init).toMatchObject({ method: 'POST', body: '{"a":1}', headers: { 'content-type': 'application/json' } });
  });

  it('una respuesta 204 no se lee como JSON', async () => {
    respond(204, null);
    expect(await apiPost('/x', {}, parse)).toEqual({ ok: true, value: -1 });
  });

  it('clasifica el código de error, el mantenimiento y la respuesta inválida', async () => {
    respond(400, { code: 'PASSWORD_RESET_CODE_INVALID' });
    expect(await apiPost('/x', {}, parse)).toMatchObject({ ok: false, failure: { kind: 'http', status: 400, code: 'PASSWORD_RESET_CODE_INVALID' } });
    respond(503, { code: 'MAINTENANCE' });
    expect(await apiPost('/x', {}, parse)).toEqual({ ok: false, failure: { kind: 'maintenance' } });
    respond(200, { v: 1 });
    expect(await apiPost('/x', {}, () => { throw new Error('mal'); })).toMatchObject({ ok: false, failure: { kind: 'http', code: 'INVALID_RESPONSE' } });
  });

  it('sin respuesta es "offline"', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('red'));
    expect(await apiPost('/x', {}, parse)).toEqual({ ok: false, failure: { kind: 'offline' } });
  });
});
