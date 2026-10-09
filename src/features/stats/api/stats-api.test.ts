import { fetchPeriodStats } from '@/features/stats/api/stats-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

describe('stats-api', () => {
  it('pide el rango con QUERY y valida la respuesta', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchPeriodStats({ from: '2026-10-01', to: '2026-10-09' });
    expect(request.mock.calls[0]).toMatchObject(['/collectors/me/stats', expect.any(Function), { method: 'QUERY', body: { dateRange: { from: '2026-10-01', to: '2026-10-09' } } }]);
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(() => parse({ from: 1 })).toThrow();
  });
});
