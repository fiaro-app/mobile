import { amountErrorMessage, formatAmountInput, parseAmountInput, paymentKind, validateAmount } from '@/features/visit/lib/amount';
import { rescheduleOptions } from '@/features/visit/lib/reschedule-dates';
import { paidVisit, rescheduledVisit, unpaidVisit, VisitRequestSchema } from '@/features/visit/lib/visit-request';

const ID = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const NOW = new Date('2026-10-09T20:30:00Z');

describe('monto', () => {
  it('interpreta lo que se teclea', () => {
    expect(parseAmountInput('35.000')).toBe(35000);
    expect(parseAmountInput('$ 1.250.000')).toBe(1250000);
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
  });

  it('da formato de miles mientras se teclea', () => {
    expect(formatAmountInput('35000')).toBe('35.000');
    expect(formatAmountInput('1250000')).toBe('1.250.000');
    expect(formatAmountInput('x')).toBe('');
  });

  it('valida contra el saldo', () => {
    expect(validateAmount(null, 420000)).toBe('required');
    expect(validateAmount(0, 420000)).toBe('required');
    expect(validateAmount(500000, 420000)).toBe('over-balance');
    expect(validateAmount(35000, 420000)).toBeNull();
    expect(validateAmount(420000, 420000)).toBeNull();
  });

  it('explica cada error', () => {
    expect(amountErrorMessage('required', 1)).toContain('mayor a cero');
    expect(amountErrorMessage('over-balance', 420000)).toContain('$420.000');
  });

  it('distingue pago completo de parcial', () => {
    expect(paymentKind(35000, 35000)).toBe('full');
    expect(paymentKind(50000, 35000)).toBe('full');
    expect(paymentKind(20000, 35000)).toBe('partial');
  });
});

describe('peticiones de visita', () => {
  it('arma la visita con pago con la hora real y la valida con el schema', () => {
    const request = paidVisit(ID, 35000, 'NEQUI', NOW);
    expect(request).toEqual({ id: ID, outcome: 'PAID', occurredAt: '2026-10-09T20:30:00.000Z', payment: { amount: 35000, method: 'NEQUI' } });
    expect(VisitRequestSchema.safeParse(request).success).toBe(true);
  });

  it('arma las visitas sin pago y la reprogramada', () => {
    expect(unpaidVisit(ID, 'NOT_FOUND', NOW)).toEqual({ id: ID, outcome: 'NOT_FOUND', occurredAt: '2026-10-09T20:30:00.000Z' });
    expect(rescheduledVisit(ID, '2026-10-15', NOW)).toMatchObject({ outcome: 'RESCHEDULED', promisedDate: '2026-10-15' });
  });

  it('rechaza montos no enteros, cero o ids inválidos', () => {
    expect(VisitRequestSchema.safeParse(paidVisit(ID, 0, 'CASH', NOW)).success).toBe(false);
    expect(VisitRequestSchema.safeParse(paidVisit(ID, 10.5, 'CASH', NOW)).success).toBe(false);
    expect(VisitRequestSchema.safeParse({ ...unpaidVisit('no-es-uuid', 'REFUSED', NOW) }).success).toBe(false);
  });
});

describe('rescheduleOptions', () => {
  it('ofrece los próximos días desde mañana, con nombre del día', () => {
    const options = rescheduleOptions('2026-10-09', 3);
    expect(options).toEqual([
      { value: '2026-10-10', label: 'Sábado, 10/10/2026' },
      { value: '2026-10-11', label: 'Domingo, 11/10/2026' },
      { value: '2026-10-12', label: 'Lunes, 12/10/2026' },
    ]);
  });

  it('cruza el fin de mes y de año', () => {
    expect(rescheduleOptions('2026-12-31', 2).map((o) => o.value)).toEqual(['2027-01-01', '2027-01-02']);
    expect(rescheduleOptions('2026-10-09')).toHaveLength(14);
  });
});
