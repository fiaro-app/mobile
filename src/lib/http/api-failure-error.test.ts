import { ApiFailureError, failureOf, unwrapOrThrow } from '@/lib/http/api-failure-error';

describe('api-failure-error', () => {
  it('devuelve el valor de un resultado exitoso', () => {
    expect(unwrapOrThrow({ ok: true, value: 7 })).toBe(7);
  });

  it('lanza un error que conserva el fallo', () => {
    const failure = { kind: 'offline' } as const;
    expect(() => unwrapOrThrow({ ok: false, failure })).toThrow(ApiFailureError);
    try {
      unwrapOrThrow({ ok: false, failure });
    } catch (error) {
      expect(failureOf(error)).toEqual(failure);
    }
  });

  it('ignora errores de otro tipo', () => {
    expect(failureOf(new Error('x'))).toBeNull();
    expect(failureOf(null)).toBeNull();
  });
});
