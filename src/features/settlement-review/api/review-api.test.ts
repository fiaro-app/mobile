import { approveSettlement, fetchSettlementById, fetchSettlements, rejectSettlement } from '@/features/settlement-review/api/review-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;
const settlement = { id: 's1', collectorMembershipId: 'm1', date: '2026-10-09', expectedAmount: 1, collectedAmount: 1, collectedByMethod: { CASH: 1, NEQUI: 0, TRANSFER: 0 }, status: 'PENDING', collectorNote: null, reviewNote: null, reviewedAt: null, submittedAt: '2026-10-09T10:00:00Z' };

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('review-api', () => {
  it('lista por estado y devuelve items y total', async () => {
    await fetchSettlements(2, 'PENDING');
    expect(request.mock.calls[0]).toMatchObject(['/daily-settlements', expect.any(Function), { method: 'QUERY', body: { page: 2, pageSize: 10, status: 'PENDING' } }]);
    expect(parserOf(0)({ data: [settlement], meta: { total: 7 } })).toMatchObject({ total: 7 });
  });

  it('lee un cuadre y lo revisa; sin comentario no manda reviewNote', async () => {
    await fetchSettlementById('s1');
    await approveSettlement('s1', '  ');
    await rejectSettlement('s1', ' Falta el recibo ');
    expect(request.mock.calls[0]?.[0]).toBe('/daily-settlements/s1');
    expect(request.mock.calls[1]).toMatchObject(['/daily-settlements/s1/approve', expect.any(Function), { method: 'POST', body: {} }]);
    expect(request.mock.calls[2]).toMatchObject(['/daily-settlements/s1/reject', expect.any(Function), { method: 'POST', body: { reviewNote: 'Falta el recibo' } }]);
    expect(parserOf(0)(settlement)).toMatchObject({ id: 's1' });
    expect(() => parserOf(1)({})).toThrow();
  });
});
