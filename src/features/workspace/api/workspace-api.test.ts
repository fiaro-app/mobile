import { fetchLender, fetchOwnRoles } from '@/features/workspace/api/workspace-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const http = (status: number) => ({ ok: false, failure: { kind: 'http', status, code: null, retryAfterSeconds: null } }) as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchOwnRoles', () => {
  it('busca la membresía propia entre las activas', async () => {
    request.mockResolvedValue({ ok: true, value: { data: [{ userId: 'u2', roles: ['COLLECTOR'] }, { userId: 'u1', roles: ['OWNER'] }] } });
    expect(await fetchOwnRoles('u1')).toEqual({ ok: true, value: ['OWNER'] });
    expect(request.mock.calls[0]).toMatchObject(['/memberships', expect.any(Function), { method: 'QUERY', body: { page: 1, pageSize: 100, status: 'ACTIVE' } }]);
  });

  it('sin membresía propia devuelve una lista vacía', async () => {
    request.mockResolvedValue({ ok: true, value: { data: [] } });
    expect(await fetchOwnRoles('u1')).toEqual({ ok: true, value: [] });
  });

  it('un 403 significa cobrador; otros fallos se propagan', async () => {
    request.mockResolvedValue(http(403));
    expect(await fetchOwnRoles('u1')).toEqual({ ok: true, value: ['COLLECTOR'] });
    request.mockResolvedValue(http(500));
    expect((await fetchOwnRoles('u1')).ok).toBe(false);
  });

  it('valida la respuesta', async () => {
    request.mockResolvedValue({ ok: true, value: { data: [] } });
    await fetchOwnRoles('u1');
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(() => parse({ data: [{ userId: 'u', roles: ['ROOT'] }] })).toThrow();
  });
});

describe('fetchLender', () => {
  it('lee los datos públicos del prestamista', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchLender();
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ id: 'l', name: 'El Águila', logoUrl: null, brandColor: '#112233' })).toMatchObject({ name: 'El Águila' });
    expect(() => parse({ id: 1 })).toThrow();
  });
});
