import { fetchDailySummary, fetchSettlement, postSettlement } from '@/features/settlement/api/settlement-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;
const settlement = { id: 's1', date: '2026-10-09', expectedAmount: 1, collectedAmount: 1, collectedByMethod: { CASH: 1, NEQUI: 0, TRANSFER: 0 }, status: 'APPROVED', collectorNote: null, reviewNote: null };

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('settlement-api', () => {
  it('pide el resumen con QUERY, con y sin fecha', async () => {
    await fetchDailySummary();
    await fetchDailySummary('2026-10-08');
    expect(request.mock.calls[0]).toMatchObject(['/collectors/me/daily-summary', expect.any(Function), { method: 'QUERY', body: {} }]);
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { date: '2026-10-08' } });
  });

  it('envía el cuadre por POST y consulta uno por id', async () => {
    const body = { expectedAmount: 1, collectedCash: 1, collectedNequi: 0, collectedTransfer: 0, collectorNote: null };
    await postSettlement(body);
    await fetchSettlement('s1');
    expect(request.mock.calls[0]).toMatchObject(['/daily-settlements', expect.any(Function), { method: 'POST', body }]);
    expect(request.mock.calls[1]?.[0]).toBe('/daily-settlements/s1');
    expect(parserOf(0)(settlement)).toMatchObject({ id: 's1' });
    expect(() => parserOf(1)({ id: 1 })).toThrow();
  });
});
