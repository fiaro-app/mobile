import { fetchMembers } from '@/features/team/api/team-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const member = { id: 'm', userId: 'u', fullName: 'Ana', phone: '+573001234567', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: null };

describe('fetchMembers', () => {
  it('pide la primera página, con o sin estado, y devuelve solo los datos', async () => {
    request.mockResolvedValue({ ok: true, value: [] });
    await fetchMembers();
    await fetchMembers('ACTIVE');
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 50 } });
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 50, status: 'ACTIVE' } });
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ data: [member], meta: { total: 1 } })).toEqual([member]);
    expect(() => parse({ data: [{ ...member, status: 'X' }], meta: { total: 1 } })).toThrow();
  });
});
