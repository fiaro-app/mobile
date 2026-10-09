import { classifyHttpFailure, parseRetryAfter } from '@/lib/http/failure';

describe('parseRetryAfter', () => {
  it.each([
    ['30', 30],
    ['1.2', 2],
    ['0', 0],
  ])('interpreta %s como %s segundos', (header, seconds) => {
    expect(parseRetryAfter(header)).toBe(seconds);
  });

  it.each([null, undefined, '', 'Wed, 21 Oct 2026 07:28:00 GMT', '-5'])('ignora %s', (header) => {
    expect(parseRetryAfter(header)).toBeNull();
  });
});

describe('classifyHttpFailure', () => {
  it('reconoce el modo mantenimiento', () => {
    expect(classifyHttpFailure(503, 'MAINTENANCE')).toEqual({ kind: 'maintenance' });
  });

  it('un 503 sin ese código es un error HTTP normal', () => {
    expect(classifyHttpFailure(503, null)).toEqual({
      kind: 'http',
      status: 503,
      code: null,
      retryAfterSeconds: null,
    });
  });

  it('conserva el código y la espera de un bloqueo', () => {
    expect(classifyHttpFailure(429, 'SIGN_IN_LOCKED', '900')).toEqual({
      kind: 'http',
      status: 429,
      code: 'SIGN_IN_LOCKED',
      retryAfterSeconds: 900,
    });
  });
});
