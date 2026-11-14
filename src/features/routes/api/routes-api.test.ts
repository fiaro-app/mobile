import { fetchRoutes } from '@/features/routes/api/routes-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;
const route = { date: '2026-10-14', collector: { membershipId: 'm1', fullName: 'Ana Soto' }, startedAt: '2026-10-14T13:05:00Z', endedAt: '2026-10-14T21:30:00Z', visitsCount: 12, paidCount: 9, expectedAmount: 360_000, collectedAmount: 270_000 };

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('routes-api', () => {
  it('lista con QUERY, con rango y cobrador cuando los hay, y devuelve items y total', async () => {
    await fetchRoutes(2, { range: { from: '2026-10-10', to: '2026-10-14' }, collectorId: 'm1' });
    await fetchRoutes(1, { range: null, collectorId: null });
    expect(request.mock.calls[0]).toMatchObject(['/collection-visits/routes', expect.any(Function), { method: 'QUERY', body: { page: 2, pageSize: 10, dateRange: { from: '2026-10-10', to: '2026-10-14' }, collectorMembershipId: 'm1' } }]);
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 10 } });
    expect(parserOf(0)({ data: [route], meta: { total: 7 } })).toMatchObject({ total: 7, items: [{ visitsCount: 12 }] });
    expect(() => parserOf(0)({ data: [{}], meta: { total: 1 } })).toThrow();
  });
});
