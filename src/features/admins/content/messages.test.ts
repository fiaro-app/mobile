import { adminFailureMessage } from '@/features/admins/content/messages';

const http = (status: number, code: string | null) => ({ kind: 'http', status, code, retryAfterSeconds: null }) as const;

describe('adminFailureMessage', () => {
  it.each([
    [http(403, 'FORBIDDEN'), /No tienes permiso/],
    [http(403, 'SUBSCRIPTION_READ_ONLY'), /solo lectura/],
    [http(403, 'PLAN_LIMIT_REACHED'), /cupos de administrador/],
    [http(404, 'NOT_FOUND'), /ya no existe/],
    [http(409, 'CONFLICT'), /ya trabaja/],
    [http(409, 'COLLABORATOR_NATIONAL_ID_TAKEN'), /con esa cédula/],
    [http(400, 'VALIDATION_FAILED'), /del dueño/],
    [http(429, null), /Demasiados intentos/],
    [http(500, null), /No pudimos completar/],
    [{ kind: 'offline' } as const, /Sin conexión/],
    [{ kind: 'maintenance' } as const, /mantenimiento/],
  ])('explica %j', (failure, message) => {
    expect(adminFailureMessage(failure as never)).toMatch(message);
  });
});
