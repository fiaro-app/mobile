import { fetchRoute } from '@/features/route/api/route-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

describe('fetchRoute', () => {
  it('pide la ruta de hoy con QUERY y cuerpo vacío', async () => {
    request.mockResolvedValue({ ok: true, value: [] });
    await fetchRoute();
    expect(request).toHaveBeenCalledWith('/collectors/me/route', expect.any(Function), { method: 'QUERY', body: {} });
  });

  it('manda la fecha cuando se pide otra', async () => {
    request.mockResolvedValue({ ok: true, value: [] });
    await fetchRoute('2026-10-02');
    expect(request).toHaveBeenLastCalledWith('/collectors/me/route', expect.any(Function), { method: 'QUERY', body: { date: '2026-10-02' } });
  });

  it('valida la respuesta con el schema', async () => {
    request.mockResolvedValue({ ok: true, value: [] });
    await fetchRoute();
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse([])).toEqual([]);
    expect(() => parse([{ loanId: 1 }])).toThrow();
  });
});
