import { changeCollectorPortfolio, deactivateCollector, fetchCollectorStats, fetchPortfolios, inviteCollector, resetCollectorPassword } from '@/features/collectors/api/collectors-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('collectors-api', () => {
  it('invita con POST y valida la respuesta', async () => {
    await inviteCollector({ fullName: 'Carlos Ramírez', nationalId: '1.020.304.050', phone: '300 123 4567', contactEmail: '', portfolioId: 'p1' });
    expect(request.mock.calls[0]).toMatchObject(['/memberships', expect.any(Function), { method: 'POST', body: { phone: '+573001234567', roles: ['COLLECTOR'], portfolioId: 'p1' } }]);
    expect(parserOf(0)({ id: 'm', tempPassword: 'abc' })).toEqual({ id: 'm', tempPassword: 'abc' });
  });

  it('desactiva, restablece y cambia de cartera', async () => {
    await deactivateCollector('m1');
    await resetCollectorPassword('m1');
    await changeCollectorPortfolio('m1', ['COLLECTOR'], 'p2');
    expect(request.mock.calls.map((call) => call[0])).toEqual(['/memberships/m1/deactivate', '/memberships/m1/reset-password', '/memberships/m1/roles']);
    expect(request.mock.calls[2]?.[2]).toEqual({ method: 'PATCH', body: { roles: ['COLLECTOR'], portfolioId: 'p2' } });
    expect(parserOf(1)({ tempPassword: 'x' })).toBe('x');
    expect(() => parserOf(1)({})).toThrow();
  });

  it('lee carteras y desempeño', async () => {
    await fetchPortfolios();
    await fetchCollectorStats('m1', { from: '2026-10-01', to: '2026-10-09' });
    expect(request.mock.calls[0]?.[0]).toBe('/portfolios');
    expect(parserOf(0)([{ id: 'p', name: 'General', isDefault: true }])).toHaveLength(1);
    expect(request.mock.calls[1]?.[0]).toBe('/collectors/m1/stats?from=2026-10-01&to=2026-10-09');
    expect(() => parserOf(1)({})).toThrow();
  });
});
