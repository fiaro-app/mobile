import { attachmentFailureMessage } from '@/features/attachments/content/messages';

describe('attachmentFailureMessage', () => {
  it('explains offline, maintenance, forbidden and any other failure', () => {
    expect(attachmentFailureMessage({ kind: 'offline' })).toMatch(/Sin conexión/);
    expect(attachmentFailureMessage({ kind: 'maintenance' } as never)).toMatch(/mantenimiento/);
    expect(attachmentFailureMessage({ kind: 'http', status: 403, code: 'FORBIDDEN', retryAfterSeconds: null })).toMatch(/permiso/);
    expect(attachmentFailureMessage({ kind: 'http', status: 500, code: null, retryAfterSeconds: null })).toMatch(/No pudimos subir/);
  });
});
