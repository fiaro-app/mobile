import { fetchDashboard } from '@/features/dashboard/api/dashboard-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

describe('fetchDashboard', () => {
  it('pide el resumen y valida la respuesta', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchDashboard();
    expect(request.mock.calls[0]?.[0]).toBe('/lenders/me/dashboard');
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(() => parse({})).toThrow();
  });

  it('con un rango pide las cifras de ese período', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchDashboard({ from: '2026-10-01', to: '2026-10-09' });
    expect(request.mock.calls.at(-1)?.[0]).toBe('/lenders/me/dashboard?from=2026-10-01&to=2026-10-09');
  });
});
