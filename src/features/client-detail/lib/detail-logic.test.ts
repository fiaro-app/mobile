import { formatPhone, installmentLabel } from '@/features/client-detail/lib/detail-labels';
import { buildClientDetail } from '@/features/client-detail/lib/detail-view-model';
import type { Balance, Client, Loan, Visit } from '@/features/client-detail/lib/detail-schemas';

const client: Client = { id: 'c1', fullName: 'Marta Gómez', occupation: 'Tendera', phone: '+573001234567', address: 'Cl 45 # 12-30' };
const loan: Loan = { id: 'l1', clientId: 'c1', installmentValue: 35000, frequency: 'DAILY', status: 'ACTIVE' };
const balance: Balance = { loanId: 'l1', balance: 420000, overdueAmount: 90000, overdueDays: 12, nextDueDate: '2026-10-09' };
const visit = (over: Partial<Visit>): Visit => ({ id: 'v', outcome: 'PAID', promisedDate: null, occurredAt: '2026-09-12T15:00:00Z', payment: { amount: 35000, method: 'CASH', reversal: null }, ...over });

describe('labels', () => {
  it('etiqueta la cuota según la frecuencia', () => {
    expect(installmentLabel('DAILY')).toBe('Cuota diaria');
    expect(installmentLabel('BIWEEKLY')).toBe('Cuota quincenal');
  });

  it('formatea el celular colombiano y respeta otros formatos', () => {
    expect(formatPhone('+573001234567')).toBe('+57 300 123 4567');
    expect(formatPhone('+15551234567')).toBe('+15551234567');
  });
});

describe('buildClientDetail', () => {
  const model = (visits: Visit[] = [], today = '2026-10-09', over: Partial<Loan> = {}) =>
    buildClientDetail({ client, loan: { ...loan, ...over }, balance, visits }, today);

  it('resume cliente, saldo y mora', () => {
    expect(model()).toMatchObject({
      name: 'Marta Gómez',
      initials: 'MG',
      status: 'delinquent',
      phone: '+57 300 123 4567',
      phoneDial: '+573001234567',
      balanceLabel: '$420.000',
      installmentName: 'Cuota diaria',
      installmentLabel: '$35.000',
      overdueLabel: '12 días',
      overdueAlert: true,
      installmentValue: 35000,
      suggestedAmount: 90000,
    });
  });

  it('el monto sugerido es mora + cuota, la cuota si está al día y nunca pasa del saldo', () => {
    const suggested = (over: Partial<Balance>) => buildClientDetail({ client, loan, balance: { ...balance, ...over }, visits: [] }).suggestedAmount;
    expect(suggested({ overdueAmount: 0, overdueDays: 0 })).toBe(35000);
    expect(suggested({ balance: 50000 })).toBe(50000);
    expect(suggested({ balance: 20000, overdueAmount: 0 })).toBe(20000);
  });

  it('la próxima visita es "Hoy" si vence hoy o ya venció (fecha de Colombia)', () => {
    expect(model().nextVisitLabel).toBe('Hoy');
    expect(model([], '2026-10-08').nextVisitLabel).toBe('9 oct 2026');
    expect(model([], '2026-10-20').nextVisitLabel).toBe('Hoy');
    expect(buildClientDetail({ client, loan, balance: { ...balance, nextDueDate: null }, visits: [] }).nextVisitLabel).toBe('—');
  });

  it('ordena el historial del más reciente al más antiguo', () => {
    const rows = model([visit({ id: 'a', occurredAt: '2026-09-10T15:00:00Z' }), visit({ id: 'b', occurredAt: '2026-09-12T15:00:00Z' })]).history;
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('traduce pagos, visitas sin pago y pagos anulados', () => {
    const rows = model([
      visit({ id: 'pay' }),
      visit({ id: 'nf', outcome: 'NOT_FOUND', payment: null, occurredAt: '2026-09-11T15:00:00Z' }),
      visit({ id: 'rs', outcome: 'RESCHEDULED', payment: null, occurredAt: '2026-09-10T15:00:00Z' }),
      visit({ id: 'rev', occurredAt: '2026-09-09T15:00:00Z', payment: { amount: 35000, method: 'NEQUI', reversal: { id: 'r' } } }),
    ]).history;
    expect(rows[0]).toMatchObject({ methodLabel: 'Efectivo', amountLabel: '$35.000', outcomeLabel: 'Pagado', outcomeTone: 'success' });
    expect(rows[1]).toMatchObject({ methodLabel: null, amountLabel: '$0', outcomeLabel: 'No encontrado', outcomeTone: 'alert' });
    expect(rows[2]).toMatchObject({ outcomeLabel: 'Reprogramada', outcomeTone: 'neutral' });
    expect(rows[3]).toMatchObject({ outcomeLabel: 'Anulado', amountLabel: '$0', outcomeTone: 'alert' });
  });

  it('solo permite registrar visita con el préstamo activo', () => {
    expect(model().canRegisterVisit).toBe(true);
    expect(model([], '2026-10-09', { status: 'PAID_OFF' }).canRegisterVisit).toBe(false);
  });
});
