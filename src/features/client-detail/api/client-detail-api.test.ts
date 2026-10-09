import { fetchBalance, fetchClient, fetchLoan, fetchVisits } from '@/features/client-detail/api/client-detail-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('client-detail-api', () => {
  it('pide cada recurso a su ruta', async () => {
    await fetchClient('c1');
    await fetchLoan('l1');
    await fetchBalance('l1');
    await fetchVisits('l1');
    expect(request.mock.calls.map((call) => call[0])).toEqual(['/clients/c1', '/loans/l1', '/loans/l1/balance', '/loans/l1/collection-visits']);
  });

  it('valida cada respuesta con su schema', async () => {
    await fetchClient('c1');
    await fetchLoan('l1');
    await fetchBalance('l1');
    await fetchVisits('l1');
    expect(parserOf(0)({ id: 'c', fullName: 'A', occupation: 'x', phone: '+573001234567', address: 'y' })).toMatchObject({ id: 'c' });
    expect(() => parserOf(0)({ id: 1 })).toThrow();
    expect(parserOf(1)({ id: 'l', clientId: 'c', installmentValue: 1, frequency: 'DAILY', status: 'ACTIVE' })).toMatchObject({ id: 'l' });
    expect(() => parserOf(1)({ frequency: 'YEARLY' })).toThrow();
    expect(parserOf(2)({ loanId: 'l', balance: 1, overdueAmount: 0, overdueDays: 0, nextDueDate: null })).toMatchObject({ balance: 1 });
    expect(parserOf(3)([])).toEqual([]);
    expect(() => parserOf(3)([{ outcome: 'OTRO' }])).toThrow();
  });
});
