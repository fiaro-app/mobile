import { resolveGateStatus } from '@/features/system/lib/gate-status';

const remote = { minimumSupportedVersion: '1.2.0', latestVersion: '1.4.0', downloadUrl: 'https://fiaro.co/a.apk' };

describe('resolveGateStatus', () => {
  it('está comprobando mientras no hay resultado', () => {
    expect(resolveGateStatus(null, '1.0.0')).toBe('checking');
  });

  it('deja pasar una versión soportada', () => {
    expect(resolveGateStatus({ ok: true, value: remote }, '1.3.0')).toBe('ok');
  });

  it('bloquea una versión vieja', () => {
    expect(resolveGateStatus({ ok: true, value: remote }, '1.0.0')).toBe('update-required');
  });

  it('distingue mantenimiento de falta de conexión', () => {
    expect(resolveGateStatus({ ok: false, failure: { kind: 'maintenance' } }, '1.3.0')).toBe('maintenance');
    expect(resolveGateStatus({ ok: false, failure: { kind: 'offline' } }, '1.3.0')).toBe('offline');
  });

  it('trata un error HTTP como falta de conexión', () => {
    const failure = { kind: 'http', status: 500, code: null, retryAfterSeconds: null } as const;
    expect(resolveGateStatus({ ok: false, failure }, '1.3.0')).toBe('offline');
  });
});
