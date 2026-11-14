import { fetchCollectorsToday } from '@/features/collectors-today/api/collectors-today-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

describe('fetchCollectorsToday', () => {
  it('pide la jornada de hoy y valida la respuesta', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchCollectorsToday();
    expect(request.mock.calls[0]?.[0]).toBe('/lenders/me/collectors-today');
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(() => parse({})).toThrow();
  });
});
