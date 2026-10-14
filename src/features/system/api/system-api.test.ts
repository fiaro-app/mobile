import { fetchMobileVersion } from '@/features/system/api/system-api';

const body = { minimumSupportedVersion: '1.0.0', latestVersion: '1.2.0', downloadUrl: 'https://fiaro.co/app.apk' };

describe('fetchMobileVersion', () => {
  it('valida y devuelve la versión', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    expect(await fetchMobileVersion()).toEqual({ ok: true, value: body });
  });

  it('rechaza un cuerpo que no cumple el contrato', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ latestVersion: 'x' })));
    expect(await fetchMobileVersion()).toMatchObject({ ok: false });
  });
});
