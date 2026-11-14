import { clearNotifications, deleteNotification, fetchNotifications, fetchUnreadCount, markAllRead, markRead, registerPushToken, revokePushToken } from '@/features/notifications/api/notifications-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));

const request = jest.mocked(authedRequest);
const parserOf = (call: number) => request.mock.calls[call]?.[1] as (body: unknown) => unknown;
const item = { id: 'n1', severity: 'INFO', title: 't', body: 'b', relatedEntityType: null, relatedEntityId: null, readAt: null, createdAt: '2026-10-09T10:00:00Z' };

beforeEach(() => {
  jest.clearAllMocks();
  request.mockResolvedValue({ ok: true, value: {} });
});

describe('notifications-api', () => {
  it('lista con QUERY y devuelve solo los datos de la página', async () => {
    await fetchNotifications();
    expect(request.mock.calls[0]).toMatchObject(['/notifications', expect.any(Function), { method: 'QUERY', body: { page: 1, pageSize: 50 } }]);
    expect(parserOf(0)({ data: [item], meta: { total: 1 } })).toEqual([item]);
  });

  it('cuenta sin leer y marca leídas', async () => {
    await fetchUnreadCount();
    await markRead('n1');
    await markAllRead();
    expect(request.mock.calls.map((call) => call[0])).toEqual(['/notifications/unread-count', '/notifications/n1/read', '/notifications/read-all']);
    expect(parserOf(0)({ count: 4 })).toBe(4);
    expect(() => parserOf(0)({ count: -1 })).toThrow();
    expect(parserOf(1)(item)).toMatchObject({ id: 'n1' });
  });

  it('registra y revoca el token push', async () => {
    await registerPushToken('ExponentPushToken[abc]');
    await revokePushToken('ExponentPushToken[abc]');
    expect(request.mock.calls[0]).toMatchObject(['/push-tokens', expect.any(Function), { method: 'POST', body: { token: 'ExponentPushToken[abc]' } }]);
    expect(request.mock.calls[1]?.[0]).toBe('/push-tokens/revoke');
  });

  it('borra una y borra varias, leyendo cuántas borró', async () => {
    await deleteNotification('n1');
    await clearNotifications(true);
    expect(request.mock.calls[0]).toMatchObject(['/notifications/n1', expect.any(Function), { method: 'DELETE' }]);
    expect(request.mock.calls[1]).toMatchObject(['/notifications/clear', expect.any(Function), { method: 'POST', body: { onlyRead: true } }]);
    expect(parserOf(1)({ deleted: 3 })).toBe(3);
    expect(() => parserOf(1)({})).toThrow();
  });
});
