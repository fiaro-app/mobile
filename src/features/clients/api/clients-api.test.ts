import { createClient, fetchClientById, fetchClientLoans, fetchClients, updateClient } from '@/features/clients/api/clients-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;
const client = { id: 'c1', nationalId: '1020304050', fullName: 'Marta', occupation: 'x', phone: '+573001112233', address: 'y' };

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('clients-api', () => {
  it('lista con QUERY, con y sin búsqueda, devolviendo items y total', async () => {
    await fetchClients(2, ' marta ');
    await fetchClients(1, '');
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { page: 2, pageSize: 10, search: 'marta' } });
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 10 } });
    expect(parserOf(0)({ data: [{ ...client, balance: 1, overdueAmount: 0, overdueDays: 0, activeLoans: 1 }], meta: { total: 9 } })).toMatchObject({ total: 9 });
  });

  it('lee, crea y actualiza un cliente', async () => {
    await fetchClientById('c1');
    await createClient({ fullName: 'Marta', nationalId: '1.020.304.050', phone: '300 111 2233', occupation: 'x', address: 'y' });
    await updateClient('c1', { address: 'z' });
    expect(request.mock.calls[0]?.[0]).toBe('/clients/c1');
    expect(request.mock.calls[1]).toMatchObject(['/clients', expect.any(Function), { method: 'POST', body: { nationalId: '1020304050', phone: '+573001112233' } }]);
    expect(request.mock.calls[2]).toMatchObject(['/clients/c1', expect.any(Function), { method: 'PATCH', body: { address: 'z' } }]);
    expect(parserOf(0)(client)).toMatchObject({ id: 'c1' });
    expect(() => parserOf(0)({})).toThrow();
  });

  it('lista los préstamos del cliente', async () => {
    await fetchClientLoans('c1');
    expect(request.mock.calls[0]).toMatchObject(['/loans', expect.any(Function), { method: 'QUERY', body: { page: 1, pageSize: 20, clientId: 'c1' } }]);
    expect(parserOf(0)({ data: [], meta: { total: 0 } })).toEqual([]);
  });
});
