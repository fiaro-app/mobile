import { REVIEW_COPY, reviewFailureMessage } from '@/features/settlement-review/content/messages';
import { ReviewSettlementSchema } from '@/features/settlement-review/lib/review-schemas';
import { describeDifference, toReviewDetail, toReviewRow, UNKNOWN_COLLECTOR } from '@/features/settlement-review/lib/review-view-model';

const settlement = (over = {}) => ({
  id: 's1', collectorMembershipId: 'm1', date: '2026-10-09', expectedAmount: 450000, collectedAmount: 420000, collectedByMethod: { CASH: 300000, NEQUI: 120000, TRANSFER: 0 },
  status: 'PENDING' as const, collectorNote: 'Un cliente no pagó', reviewNote: null, reviewedAt: null, submittedAt: '2026-10-09T23:00:00Z', ...over,
});

describe('cuadres del administrador', () => {
  it('describe la diferencia', () => {
    expect(describeDifference(100, 100)).toEqual({ text: 'Cuadra', tone: 'good' });
    expect(describeDifference(100, 70)).toEqual({ text: '-$30', tone: 'bad' });
    expect(describeDifference(100, 120)).toEqual({ text: '$20', tone: 'warning' });
  });

  it('arma la fila con nombre y estado', () => {
    const names = new Map([['m1', 'Alejo Zuleta']]);
    expect(toReviewRow(settlement(), names)).toEqual({ id: 's1', title: 'Alejo Zuleta', subtitle: '9 oct 2026 · Cuadre $450.000', difference: '-$30.000', differenceTone: 'bad', badge: { label: 'PENDIENTE', kind: 'warning' } });
    expect(toReviewRow(settlement({ status: 'APPROVED', collectorMembershipId: 'x' }), names)).toMatchObject({ title: UNKNOWN_COLLECTOR, badge: { label: 'APROBADO', kind: 'good' } });
    expect(toReviewRow(settlement({ status: 'REJECTED' }), names).badge.label).toBe('RECHAZADO');
  });

  it('arma el detalle y solo permite revisar los pendientes', () => {
    const pending = toReviewDetail(settlement(), 'Alejo Zuleta');
    expect(pending).toMatchObject({ collectorName: 'Alejo Zuleta', reviewable: true, summary: '$420.000 de $450.000 esperados', collectorNote: 'Un cliente no pagó', difference: '-$30.000' });
    expect(pending.rows.map((row) => row.label)).toEqual(['Fecha', 'Esperado', 'Efectivo', 'Nequi', 'Transferencia', 'Cobrado', 'Diferencia', 'Enviado']);
    expect(pending.rows.find((row) => row.label === 'Diferencia')?.alert).toBe(true);
    const reviewed = toReviewDetail(settlement({ status: 'REJECTED', reviewNote: 'Falta el recibo', reviewedAt: '2026-10-10T12:00:00Z' }), 'A');
    expect(reviewed).toMatchObject({ reviewable: false, reviewNote: 'Falta el recibo' });
    expect(reviewed.rows.at(-1)).toEqual({ label: 'Revisado', value: '10 oct 2026' });
  });

  it('valida la respuesta del API', () => {
    expect(ReviewSettlementSchema.parse(settlement()).id).toBe('s1');
    expect(() => ReviewSettlementSchema.parse({ ...settlement(), status: 'X' })).toThrow();
  });

  it.each([
    [{ kind: 'offline' }, /Sin conexión/], [{ kind: 'maintenance' }, /mantenimiento/],
    [{ kind: 'http', status: 409, code: 'CONFLICT', retryAfterSeconds: null }, /ya fue revisado/], [{ kind: 'http', status: 403, code: 'FORBIDDEN', retryAfterSeconds: null }, /permiso/],
    [{ kind: 'http', status: 403, code: 'SUBSCRIPTION_READ_ONLY', retryAfterSeconds: null }, /solo lectura/], [{ kind: 'http', status: 404, code: 'NOT_FOUND', retryAfterSeconds: null }, /ya no existe/],
    [{ kind: 'http', status: 400, code: 'VALIDATION_FAILED', retryAfterSeconds: null }, /comentario/], [{ kind: 'http', status: 429, code: null, retryAfterSeconds: null }, /Demasiados/], [{ kind: 'http', status: 500, code: null, retryAfterSeconds: null }, /No pudimos/],
  ] as const)('%j', (failure, expected) => {
    expect(reviewFailureMessage(failure)).toMatch(expected);
  });

  it('los filtros ofrecen los tres estados y «Todos» al final', () => {
    expect(REVIEW_COPY.filters.map((filter) => filter.value)).toEqual(['PENDING', 'APPROVED', 'REJECTED', 'ALL']);
  });
});
