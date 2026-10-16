import { requestFailureMessage } from '@/features/loan-requests/content/messages';

const http = (status: number, code: string | null) => ({ kind: 'http', status, code, retryAfterSeconds: null }) as const;

describe('requestFailureMessage', () => {
  it.each([
    [http(409, 'CONFLICT'), /ya fue resuelta/],
    [http(403, 'FORBIDDEN'), /No tienes permiso/],
    [http(403, 'SUBSCRIPTION_READ_ONLY'), /solo lectura/],
    [http(404, 'NOT_FOUND'), /ya no existe/],
    [http(400, 'VALIDATION_FAILED'), /Revisa los datos/],
    [http(429, null), /Demasiados intentos/],
    [http(500, null), /No pudimos completar/],
    [{ kind: 'offline' } as const, /Sin conexión/],
    [{ kind: 'maintenance' } as const, /mantenimiento/],
  ])('explica %j', (failure, message) => {
    expect(requestFailureMessage(failure as never)).toMatch(message);
  });
});
