import { CollectorsTodaySchema, type CollectorsToday } from '@/features/collectors-today/lib/collectors-today-schemas';
import { bogotaTime, buildRouteProgress } from '@/features/collectors-today/lib/collectors-today-view-model';

const base: CollectorsToday['collectors'][number] = {
  membershipId: 'm1',
  fullName: 'Ana Pérez',
  status: 'IN_PROGRESS',
  routeLoans: 5,
  visitedLoans: 2,
  pendingLoans: 3,
  expectedAmount: 100000,
  collectedAmount: 40000,
  firstVisitAt: '2026-10-15T13:05:00.000Z',
  lastVisitAt: '2026-10-15T14:00:00.000Z',
  settlementStatus: null,
};
const counts = { NO_ROUTE: 0, NOT_STARTED: 1, IN_PROGRESS: 1, FINISHED: 1 };

describe('bogotaTime', () => {
  it('escribe la hora de Colombia (UTC−5)', () => {
    expect(bogotaTime('2026-10-15T13:05:00.000Z')).toBe('8:05 a. m.');
    expect(bogotaTime('2026-10-15T17:30:00.000Z')).toBe('12:30 p. m.');
    expect(bogotaTime('2026-10-15T05:00:00.000Z')).toBe('12:00 a. m.');
    expect(bogotaTime('2026-10-16T02:15:00.000Z')).toBe('9:15 p. m.');
  });
});

describe('buildRouteProgress', () => {
  it('resume cuántos ya iniciaron y cuántos terminaron', () => {
    expect(buildRouteProgress({ date: '2026-10-15', counts, collectors: [] }).summary).toBe('2 de 3 cobradores ya iniciaron su ruta · 1 la terminaron');
    expect(buildRouteProgress({ date: '2026-10-15', counts: { NO_ROUTE: 1, NOT_STARTED: 0, IN_PROGRESS: 0, FINISHED: 0 }, collectors: [] }).summary).toBe('Ningún cobrador tiene ruta hoy.');
  });

  it('arma la fila con el avance, lo que falta y la hora de inicio', () => {
    const [row] = buildRouteProgress({ date: '2026-10-15', counts, collectors: [base] }).rows;
    expect(row).toEqual({
      id: 'm1',
      name: 'Ana Pérez',
      detail: '2 de 5 visitados · faltan 3 · inició 8:05 a. m.',
      amount: '$40.000 de $100.000',
      tone: 'neutral',
      badge: 'En ruta',
    });
  });

  it('quien no ha iniciado queda en ámbar y sin hora', () => {
    const [row] = buildRouteProgress({ date: '2026-10-15', counts, collectors: [{ ...base, status: 'NOT_STARTED', visitedLoans: 0, pendingLoans: 5, firstVisitAt: null }] }).rows;
    expect(row).toMatchObject({ tone: 'warning', badge: 'Sin iniciar', detail: '0 de 5 visitados · faltan 5' });
  });
});

describe('CollectorsTodaySchema', () => {
  it('lee la respuesta del API', () => {
    expect(CollectorsTodaySchema.parse({ date: '2026-10-15', counts, collectors: [base] }).collectors).toHaveLength(1);
    expect(() => CollectorsTodaySchema.parse({ date: '2026-10-15' })).toThrow();
  });
});
