import { fetchClientsRisk } from '@/features/risk/api/risk-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const RISK = { clientId: 'c1', score: 10, level: 'LOW', loansCount: 1, factors: [] };

describe('fetchClientsRisk', () => {
  it('pide el riesgo con QUERY, valida la respuesta y devuelve la lista', async () => {
    request.mockResolvedValue({ ok: true, value: { data: [RISK] } });

    const result = await fetchClientsRisk(['c1']);

    expect(request.mock.calls[0]?.[0]).toBe('/lenders/me/clients/risk');
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { clientIds: ['c1'] } });
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(() => parse({})).toThrow();
    expect(result).toEqual({ ok: true, value: [RISK] });
  });

  it('propaga el fallo tal cual', async () => {
    request.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });

    expect(await fetchClientsRisk(['c1'])).toEqual({ ok: false, failure: { kind: 'offline' } });
  });
});
