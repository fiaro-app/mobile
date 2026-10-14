import { fetchLender, fetchOwnMembership } from '@/features/workspace/api/workspace-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchOwnMembership', () => {
  it('pide la membresía propia y valida su id y sus roles', async () => {
    request.mockResolvedValue({ ok: true, value: { id: 'm1', roles: ['OWNER'] } });
    expect(await fetchOwnMembership()).toEqual({ ok: true, value: { id: 'm1', roles: ['OWNER'] } });
    expect(request.mock.calls[0]?.[0]).toBe('/memberships/me');
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ id: 'm', roles: ['COLLECTOR'], status: 'ACTIVE' })).toEqual({ id: 'm', roles: ['COLLECTOR'] });
    expect(() => parse({ id: 'm', roles: ['ROOT'] })).toThrow();
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
