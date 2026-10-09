import { authedRequest } from '@/lib/http/authed-request';

const mockGetCookie = jest.fn();
jest.mock('@/features/auth/api/auth-client', () => ({ authClient: { getCookie: () => mockGetCookie() } }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

const parse = (body: unknown) => (body as { v: number }).v;
const respond = (status: number, body: unknown = {}, headers: Record<string, string> = {}) => {
  globalThis.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify(body), { status, headers }));
};
const lastCall = () => (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];

beforeEach(() => {
  mockGetCookie.mockResolvedValue('fiaro.session_token=abc');
});

describe('authedRequest', () => {
  it('manda la cookie guardada y el esquema de la app', async () => {
    respond(200, { v: 7 });
    expect(await authedRequest('/collectors/me/route', parse)).toEqual({ ok: true, value: 7 });
    const [url, init] = lastCall();
    expect(url).toContain('/collectors/me/route');
    expect(init.headers).toMatchObject({ cookie: 'fiaro.session_token=abc', 'expo-origin': 'mobile://' });
    expect(init.credentials).toBe('omit');
  });

  it('usa el método QUERY con cuerpo JSON', async () => {
    respond(200, { v: 1 });
    await authedRequest('/collectors/me/route', parse, { method: 'QUERY', body: { date: '2026-10-02' } });
    const [, init] = lastCall();
    expect(init.method).toBe('QUERY');
    expect(init.body).toBe('{"date":"2026-10-02"}');
    expect(init.headers['content-type']).toBe('application/json');
  });

  it('sin cookie no manda la cabecera', async () => {
    mockGetCookie.mockResolvedValue('');
    respond(200, { v: 1 });
    await authedRequest('/x', parse);
    expect(lastCall()[1].headers.cookie).toBeUndefined();
  });

  it('clasifica 401, mantenimiento y respuestas inválidas', async () => {
    respond(401, { code: 'UNAUTHENTICATED' });
    expect(await authedRequest('/x', parse)).toMatchObject({ failure: { kind: 'http', status: 401, code: 'UNAUTHENTICATED' } });
    respond(503, { code: 'MAINTENANCE' });
    expect(await authedRequest('/x', parse)).toEqual({ ok: false, failure: { kind: 'maintenance' } });
    respond(200, {});
    const broken = (): number => {
      throw new Error('inválido');
    };
    expect(await authedRequest('/x', broken)).toMatchObject({ failure: { code: 'INVALID_RESPONSE' } });
  });

  it('sin respuesta es "offline"', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    expect(await authedRequest('/x', parse)).toEqual({ ok: false, failure: { kind: 'offline' } });
  });
});
