import { setCurrentScreen, traceHeaders } from '@/lib/http/trace-headers';

jest.mock('expo-crypto', () => ({ randomUUID: () => '11111111-2222-4333-8444-555555555555' }));

describe('traceHeaders', () => {
  it('manda el id de sesión y la pantalla como plantilla, sin grupos', () => {
    setCurrentScreen(['(app)', 'loans', '[id]']);
    expect(traceHeaders()).toEqual({ 'x-session-id': '11111111-2222-4333-8444-555555555555', 'x-client-screen': '/loans/[id]' });
  });
});
