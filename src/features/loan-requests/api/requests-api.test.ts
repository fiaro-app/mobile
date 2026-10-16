import { approveLoanRequest, createLoanRequest, fetchLoanRequestById, fetchLoanRequests, lookupClient, rejectLoanRequest } from '@/features/loan-requests/api/requests-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;
const loanRequest = { id: 'r1', status: 'PENDING', requestedByMembershipId: 'm1', clientId: null, nationalId: '51234567', newClient: { fullName: 'Rosa', occupation: 'Tendera', phone: '+573001112233', address: 'Calle 1' }, principalAmount: 500_000, installmentCount: 20, installmentValue: 30_000, totalPayable: 600_000, frequency: 'DAILY', startDate: '2026-12-01', resolvedAt: null, rejectionReason: null, loanId: null, createdAt: '2026-10-15T12:00:00Z' };

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('requests-api', () => {
  it('consulta la cédula y solo lee si existe', async () => {
    await lookupClient('51234567');
    expect(request.mock.calls[0]).toMatchObject(['/loan-requests/client-lookup', expect.any(Function), { method: 'POST', body: { nationalId: '51234567' } }]);
    expect(parserOf(0)({ exists: true })).toBe(true);
    expect(() => parserOf(0)({})).toThrow();
  });

  it('crea la solicitud', async () => {
    const body = { nationalId: '51234567', principalAmount: 1, installmentCount: 1, installmentValue: 1, totalPayable: 1, frequency: 'DAILY', startDate: '2026-12-01' };
    await createLoanRequest(body);
    expect(request.mock.calls[0]).toMatchObject(['/loan-requests', expect.any(Function), { method: 'POST', body }]);
    expect(parserOf(0)(loanRequest)).toMatchObject({ id: 'r1' });
  });

  it('lista por estado y devuelve items y total', async () => {
    await fetchLoanRequests(2, 'PENDING');
    await fetchLoanRequests(1, null);
    expect(request.mock.calls[0]).toMatchObject(['/loan-requests', expect.any(Function), { method: 'QUERY', body: { page: 2, pageSize: 10, status: 'PENDING' } }]);
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 10 } });
    expect(parserOf(0)({ data: [loanRequest], meta: { total: 7 } })).toMatchObject({ total: 7 });
  });

  it('lee una solicitud, la acepta y la rechaza; sin motivo no manda reason', async () => {
    await fetchLoanRequestById('r1');
    await approveLoanRequest('r1');
    await rejectLoanRequest('r1', '  ');
    await rejectLoanRequest('r1', ' Está en mora ');
    expect(request.mock.calls[0]?.[0]).toBe('/loan-requests/r1');
    expect(request.mock.calls[1]).toMatchObject(['/loan-requests/r1/approve', expect.any(Function), { method: 'POST', body: {} }]);
    expect(request.mock.calls[2]?.[2]).toEqual({ method: 'POST', body: {} });
    expect(request.mock.calls[3]?.[2]).toEqual({ method: 'POST', body: { reason: 'Está en mora' } });
    expect(parserOf(0)(loanRequest)).toMatchObject({ id: 'r1' });
  });
});
