import { readImageBlob, requestLogoUploadUrl, uploadToStorage } from '@/features/settings/api/settings-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('requestLogoUploadUrl', () => {
  it('pide la URL firmada con el tipo y el peso exactos y valida la respuesta', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await requestLogoUploadUrl('image/png', 48000);
    expect(request.mock.calls[0]?.[0]).toBe('/lender/logo-upload-url');
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'POST', body: { contentType: 'image/png', sizeBytes: 48000 } });
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ uploadUrl: 'https://s/put', publicUrl: 'https://s/logo.png' })).toEqual({ uploadUrl: 'https://s/put', publicUrl: 'https://s/logo.png' });
    expect(() => parse({})).toThrow();
  });
});

describe('readImageBlob', () => {
  it('lee la imagen como Blob, o devuelve null si no se puede leer', async () => {
    const blob = { size: 12 } as Blob;
    globalThis.fetch = jest.fn().mockResolvedValueOnce({ blob: () => Promise.resolve(blob) }).mockRejectedValueOnce(new Error('sin archivo'));

    await expect(readImageBlob('file:///logo.png')).resolves.toBe(blob);
    await expect(readImageBlob('file:///falta.png')).resolves.toBeNull();
  });
});

describe('uploadToStorage', () => {
  it('sube el mismo Blob con su tipo y dice si el almacenamiento lo aceptó', async () => {
    const blob = { size: 12 } as Blob;
    const put = jest.fn().mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: false }).mockRejectedValueOnce(new Error('red'));
    globalThis.fetch = put;

    await expect(uploadToStorage('https://s/put', blob, 'image/png')).resolves.toBe(true);
    expect(put).toHaveBeenCalledWith('https://s/put', { method: 'PUT', headers: { 'content-type': 'image/png' }, body: blob });
    await expect(uploadToStorage('https://s/put', blob, 'image/png')).resolves.toBe(false);
    await expect(uploadToStorage('https://s/put', blob, 'image/png')).resolves.toBe(false);
  });
});
