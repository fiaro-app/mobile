import { toRouteRow } from '@/features/routes/lib/route-view-model';

const route = { date: '2026-10-14', collector: { membershipId: 'm1', fullName: 'Ana Soto' }, startedAt: '2026-10-14T13:05:00Z', endedAt: '2026-10-14T21:30:00Z', visitsCount: 12, paidCount: 9, expectedAmount: 360_000, collectedAmount: 270_000 };

describe('toRouteRow', () => {
  it('muestra el cobrador, el día con la hora de inicio y de fin, las visitas y lo cobrado', () => {
    const row = toRouteRow(route);

    expect(row).toMatchObject({ id: '2026-10-14|m1', title: 'Ana Soto', trailing: '$270.000' });
    expect(row.subtitle).toMatch(/^14 oct 2026 · de 8:05 a\. m\. a 4:30 p\. m\.$/);
    expect(row.detail).toBe('12 visitas · 9 en pago · esperado $360.000');
  });

  it('en singular cuando fue una sola visita', () => {
    expect(toRouteRow({ ...route, visitsCount: 1, paidCount: 0 }).detail).toBe('1 visita · 0 en pago · esperado $360.000');
  });
});
