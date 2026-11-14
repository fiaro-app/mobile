import { fetchConsolidated } from '@/features/consolidated/api/consolidated-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

describe('fetchConsolidated', () => {
  it('pide el consolidado del rango con QUERY y valida la respuesta', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchConsolidated({ from: '2026-10-01', to: '2026-10-03' });

    expect(request.mock.calls[0]?.[0]).toBe('/lenders/me/consolidated-stats');
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { dateRange: { from: '2026-10-01', to: '2026-10-03' } } });
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(() => parse({})).toThrow();
  });
});
