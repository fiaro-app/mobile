import { deleteAttachment, fetchAttachmentUrl, requestAttachmentUploadUrl, saveAttachment } from '@/features/attachments/api/attachments-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));
const request = authedRequest as jest.Mock;

describe('attachments-api', () => {
  beforeEach(() => request.mockReset());

  it('reads the signed url of a client photo', async () => {
    request.mockImplementation((_path: string, parse: (body: unknown) => unknown) => Promise.resolve(parse({ url: 'https://s/x', expiresAt: 'e' })));
    expect(await fetchAttachmentUrl('client', 'c1')).toBe('https://s/x');
    expect(request.mock.calls[0][0]).toBe('/clients/c1/photo');
  });

  it('uses the payment proof routes', async () => {
    request.mockResolvedValue({ ok: true });
    request.mockImplementationOnce((_p: string, parse: (body: unknown) => unknown) => Promise.resolve(parse({ uploadUrl: 'u', key: 'k' })));
    await requestAttachmentUploadUrl('payment', 'p1', 'image/png', 10);
    await saveAttachment('payment', 'p1', 'k');
    await deleteAttachment('payment', 'p1');
    expect(request.mock.calls.map((call) => [call[0], call[2]?.method])).toEqual([
      ['/payments/p1/proof/upload-url', 'POST'],
      ['/payments/p1/proof', 'POST'],
      ['/payments/p1/proof', 'DELETE'],
    ]);
  });
});
