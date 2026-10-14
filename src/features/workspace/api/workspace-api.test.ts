import { fetchLender, fetchOwnRoles } from '@/features/workspace/api/workspace-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const http = (status: number) => ({ ok: false, failure: { kind: 'http', status, code: null, retryAfterSeconds: null } }) as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchOwnRoles', () => {
  it('pide la membresía propia y devuelve sus roles', async () => {
    request.mockResolvedValue({ ok: true, value: { roles: ['OWNER', 'COLLECTOR'] } });
    expect(await fetchOwnRoles()).toEqual({ ok: true, value: ['OWNER', 'COLLECTOR'] });
    expect(request.mock.calls[0]?.[0]).toBe('/memberships/me');
  });

  it('propaga los fallos', async () => {
    request.mockResolvedValue(http(500));
    expect((await fetchOwnRoles()).ok).toBe(false);
  });

  it('valida la respuesta', async () => {
    request.mockResolvedValue(http(500));
    await fetchOwnRoles();
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ id: 'm', roles: ['COLLECTOR'] })).toEqual({ roles: ['COLLECTOR'] });
    expect(() => parse({ roles: ['ROOT'] })).toThrow();
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
