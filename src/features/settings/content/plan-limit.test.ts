import { planLimitMessage } from '@/features/settings/content/plan-limit';
import type { ApiFailure } from '@/lib/http/failure';

const http = (errorCode?: string): ApiFailure => ({ kind: 'http', status: 403, code: 'PLAN_LIMIT_REACHED', retryAfterSeconds: null, ...(errorCode ? { errorCode } : {}) });

describe('planLimitMessage', () => {
  it.each([
    ['M003A', /cupos de cobrador/],
    ['M007A', /cupos de administrador/],
    ['L004A', /préstamos activos/],
    ['B007A', /máximo de carteras/],
    ['X999A', /uno de sus límites/],
  ])('%s dice qué tope se alcanzó', (errorCode, expected) => {
    expect(planLimitMessage(http(errorCode), 'M003A')).toMatch(expected);
  });

  it('sin errorCode usa el tope que ese flujo siempre puede alcanzar', () => {
    expect(planLimitMessage(http(), 'L004A')).toMatch(/préstamos activos/);
    expect(planLimitMessage({ kind: 'offline' }, 'M007A')).toMatch(/cupos de administrador/);
  });
});
