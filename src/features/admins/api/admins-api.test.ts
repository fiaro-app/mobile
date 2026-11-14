import { changeRoles, deactivateMember, inviteAdmin } from '@/features/admins/api/admins-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('admins-api', () => {
  it('invita a alguien que solo administra, con el celular en formato E.164', async () => {
    await inviteAdmin({ fullName: ' Lucía Pardo ', nationalId: '1.030.405.060', phone: '310 999 8877', contactEmail: ' lucia@correo.com ' });
    expect(request.mock.calls[0]).toMatchObject([
      '/memberships',
      expect.any(Function),
      { method: 'POST', body: { phone: '+573109998877', fullName: 'Lucía Pardo', nationalId: '1030405060', contactEmail: 'lucia@correo.com', roles: ['LENDER'] } },
    ]);
    expect(parserOf(0)({ membership: { id: 'm1' }, tempPassword: 'abc' })).toMatchObject({ tempPassword: 'abc' });
  });

  it('cambia los roles y quita el acceso', async () => {
    await changeRoles('m1', ['COLLECTOR', 'LENDER']);
    await deactivateMember('m1');
    expect(request.mock.calls[0]).toMatchObject(['/memberships/m1/roles', expect.any(Function), { method: 'PATCH', body: { roles: ['COLLECTOR', 'LENDER'] } }]);
    expect(request.mock.calls[1]).toMatchObject(['/memberships/m1/deactivate', expect.any(Function), { method: 'POST', body: {} }]);
    expect(parserOf(0)({ id: 'm1' })).toEqual({ id: 'm1' });
  });
});
