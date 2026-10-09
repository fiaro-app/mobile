import { requestEmailVerification, updateProfile, verifyContactEmail } from '@/features/account/api/account-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('account-api', () => {
  it('actualiza el perfil con PATCH y valida la respuesta', async () => {
    await updateProfile({ fullName: 'Ana' });
    expect(request.mock.calls[0]).toMatchObject(['/account/profile', expect.any(Function), { method: 'PATCH', body: { fullName: 'Ana' } }]);
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ fullName: 'Ana', contactEmail: null, contactEmailVerified: false })).toMatchObject({ fullName: 'Ana' });
    expect(() => parse({})).toThrow();
  });

  it('pide y confirma el código del correo', async () => {
    await requestEmailVerification();
    await verifyContactEmail('123456');
    expect(request.mock.calls[0]?.[0]).toBe('/account/contact-email/request-verification');
    expect(request.mock.calls[1]).toMatchObject(['/account/contact-email/verify', expect.any(Function), { method: 'POST', body: { code: '123456' } }]);
  });
});
