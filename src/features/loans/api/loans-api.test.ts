import { assignCollector, cancelLoan, fetchAssignments, fetchInstallments, fetchLoan, fetchLoanBalance, fetchLoans, fetchLoanVisits, reversePayment } from '@/features/loans/api/loans-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));
jest.mock('@/lib/business-date', () => ({ businessDateOf: () => '2026-10-09' }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;
const loan = { id: 'l1', clientId: 'c1', principalAmount: 1, installmentCount: 1, installmentValue: 1, totalPayable: 1, frequency: 'DAILY', startDate: '2026-09-02', status: 'ACTIVE', closedAt: null };

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('loans-api', () => {
  it('lista con QUERY, con y sin estado', async () => {
    await fetchLoans(1);
    await fetchLoans(2, 'PAID_OFF');
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 30 } });
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 2, pageSize: 30, status: 'PAID_OFF' } });
    expect(parserOf(0)({ data: [], meta: { total: 4 } })).toEqual({ items: [], total: 4 });
  });

  it('lee préstamo, saldo, calendario, asignaciones y visitas', async () => {
    await fetchLoan('l1');
    await fetchLoanBalance('l1');
    await fetchInstallments('l1');
    await fetchAssignments('l1');
    await fetchLoanVisits('l1');
    expect(request.mock.calls.map((call) => call[0])).toEqual(['/loans/l1', '/loans/l1/balance', '/loans/l1/installments', '/loans/l1/collection-assignments', '/loans/l1/collection-visits']);
    expect(parserOf(0)(loan)).toMatchObject({ id: 'l1' });
    expect(parserOf(2)({ loanId: 'l1', asOf: '2026-10-09', installments: [] })).toEqual([]);
    expect(parserOf(3)([])).toEqual([]);
    expect(parserOf(4)([])).toEqual([]);
    expect(() => parserOf(0)({})).toThrow();
  });

  it('asigna desde hoy, anula y revierte', async () => {
    await assignCollector('l1', 'm1');
    await cancelLoan('l1');
    await reversePayment('p1', 'Error');
    expect(request.mock.calls[0]).toMatchObject(['/loans/l1/collection-assignments', expect.any(Function), { method: 'POST', body: { collectorMembershipId: 'm1', effectiveFrom: '2026-10-09' } }]);
    expect(request.mock.calls[1]).toMatchObject(['/loans/l1/cancel', expect.any(Function), { method: 'POST' }]);
    expect(request.mock.calls[2]).toMatchObject(['/payments/p1/reversals', expect.any(Function), { method: 'POST', body: { reason: 'Error' } }]);
    expect(parserOf(0)({ id: 'a', loanId: 'l1', collectorMembershipId: 'm1', effectiveFrom: '2026-10-09', effectiveTo: null })).toMatchObject({ id: 'a' });
    expect(parserOf(1)(loan)).toMatchObject({ id: 'l1' });
  });
});
