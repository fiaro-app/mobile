import { loanFailureMessage, LOANS_COPY } from '@/features/loans/content/messages';
import { currentAssignment, paidInstallments, paidPercent } from '@/features/loans/lib/loan-calculations';
import { apiStatusOf, matchesLoanFilter, matchesSearch } from '@/features/loans/lib/loan-list';
import { InstallmentsSchema, LoanBalanceSchema, LoanVisitSchema } from '@/features/loans/lib/loan-schemas';
import { summarizeInstallments, toInstallmentRows } from '@/features/loans/lib/installments-view-model';
import { toVisitRow } from '@/features/loans/lib/visit-history-view-model';

const loan = (over = {}) => ({ id: 'l1', clientId: 'c1', principalAmount: 1000000, installmentCount: 30, installmentValue: 35000, totalPayable: 1050000, frequency: 'DAILY' as const, startDate: '2026-09-02', status: 'ACTIVE' as const, closedAt: null, balance: 420000, overdueAmount: 0, overdueDays: 0, nextDueDate: null, ...over });
const assignment = (id: string, from: string, to: string | null) => ({ id, loanId: 'l1', collectorMembershipId: `m-${id}`, effectiveFrom: from, effectiveTo: to });

describe('cálculos del préstamo', () => {
  it('cuenta cuotas pagadas sin pasarse', () => {
    expect(paidInstallments(1050000, 420000, 35000, 30)).toBe(18);
    expect(paidInstallments(1050000, 0, 35000, 30)).toBe(30);
    expect(paidInstallments(1050000, 2000000, 35000, 30)).toBe(0);
    expect(paidInstallments(100, 0, 0, 5)).toBe(0);
    expect(paidInstallments(1000000, 0, 10, 5)).toBe(5);
  });

  it('calcula el porcentaje pagado', () => {
    expect(paidPercent(1000, 250)).toBe(75);
    expect(paidPercent(1000, 5000)).toBe(0);
    expect(paidPercent(1000, -5)).toBe(100);
    expect(paidPercent(0, 0)).toBe(0);
  });

  it('elige la asignación vigente: abierta primero, luego la más reciente', () => {
    expect(currentAssignment([], '2026-10-09')).toBeNull();
    expect(currentAssignment([assignment('a', '2026-10-10', null)], '2026-10-09')).toBeNull();
    expect(currentAssignment([assignment('a', '2026-09-01', '2026-09-30')], '2026-10-09')).toBeNull();
    const list = [assignment('a', '2026-09-01', '2026-10-31'), assignment('b', '2026-09-15', null), assignment('c', '2026-10-01', '2026-10-31')];
    expect(currentAssignment(list, '2026-10-09')?.id).toBe('b');
    expect(currentAssignment([list[0]!, list[2]!], '2026-10-09')?.id).toBe('c');
  });
});

describe('lista de préstamos', () => {
  it('traduce el filtro al estado del API', () => {
    expect([apiStatusOf('all'), apiStatusOf('active'), apiStatusOf('arrears'), apiStatusOf('paid'), apiStatusOf('canceled')]).toEqual([undefined, 'ACTIVE', 'ACTIVE', 'PAID_OFF', 'CANCELED']);
  });

  it('"en mora" son los vigentes con atraso', () => {
    expect(matchesLoanFilter(loan({ overdueDays: 3 }), 'arrears')).toBe(true);
    expect(matchesLoanFilter(loan({ overdueDays: 0 }), 'arrears')).toBe(false);
    expect(matchesLoanFilter(loan({ overdueDays: 3, status: 'CANCELED' }), 'arrears')).toBe(false);
    expect(matchesLoanFilter(loan({ overdueDays: 3, balance: 0 }), 'arrears')).toBe(false);
    expect(matchesLoanFilter(loan(), 'active')).toBe(true);
  });

  it('busca por nombre sin tildes', () => {
    expect(matchesSearch('Yolanda Pérez', 'perez')).toBe(true);
    expect(matchesSearch('Yolanda Pérez', '  ')).toBe(true);
    expect(matchesSearch('Yolanda Pérez', 'zzz')).toBe(false);
  });
});

describe('calendario', () => {
  const items = [
    { number: 2, dueDate: '2026-09-03', expectedAmount: 35000, paidAmount: 10000, status: 'PARTIAL' as const },
    { number: 1, dueDate: '2026-09-02', expectedAmount: 35000, paidAmount: 35000, status: 'PAID' as const },
    { number: 3, dueDate: '2026-09-04', expectedAmount: 35000, paidAmount: 0, status: 'OVERDUE' as const },
    { number: 4, dueDate: '2026-09-05', expectedAmount: 35000, paidAmount: 0, status: 'PENDING' as const },
  ];

  it('ordena y etiqueta', () => {
    const rows = toInstallmentRows(items);
    expect(rows.map((row) => row.id)).toEqual(['1', '2', '3', '4']);
    expect(rows[0]).toMatchObject({ title: 'Cuota 1', subtitle: '2 sep 2026', detail: 'Pagado $35.000 de $35.000', badge: { label: 'PAGADA', kind: 'good' } });
    expect(rows[1]?.badge.label).toBe('PARCIAL');
    expect(rows[2]).toMatchObject({ detail: '$35.000', badge: { label: 'VENCIDA', kind: 'bad' } });
    expect(rows[3]?.badge.label).toBe('PENDIENTE');
  });

  it('resume', () => {
    expect(summarizeInstallments(items)).toBe('1 de 4 pagadas · 1 vencida');
    expect(summarizeInstallments(items.slice(0, 2))).toBe('1 de 2 pagadas');
    expect(summarizeInstallments([items[2]!, { ...items[2]!, number: 9 }])).toBe('0 de 2 pagadas · 2 vencidas');
  });

  it('valida las respuestas del API', () => {
    expect(InstallmentsSchema.parse({ loanId: 'l', asOf: '2026-10-09', installments: items }).installments).toHaveLength(4);
    expect(() => InstallmentsSchema.parse({ loanId: 'l', asOf: 'x', installments: [{ ...items[0], status: 'X' }] })).toThrow();
    expect(LoanBalanceSchema.parse({ loanId: 'l', balance: 1, totalExpectedToDate: 1, overdueAmount: 0, overdueDays: 0, nextDueDate: null, firstOverdueDate: null }).balance).toBe(1);
  });
});

describe('historial de cobros', () => {
  const names = new Map([['m1', 'Ana Gómez']]);
  const visit = (over = {}) => ({ id: 'v1', collectorMembershipId: 'm1', outcome: 'PAID' as const, promisedDate: null, occurredAt: '2026-09-24T21:12:00Z', payment: { id: 'p1', amount: 35000, method: 'CASH' as const, reversal: null }, ...over });

  it('un pago vigente se puede revertir', () => {
    expect(toVisitRow(visit(), names)).toEqual({ id: 'v1', title: 'Pago · Efectivo', subtitle: '24 sep 2026 · Ana Gómez', detail: '', badge: null, trailing: '$35.000', reversiblePaymentId: 'p1', paymentId: 'p1' });
  });

  it('un pago revertido muestra el motivo y ya no se puede revertir', () => {
    const row = toVisitRow(visit({ payment: { id: 'p1', amount: 35000, method: 'NEQUI', reversal: { reason: 'Error de digitación' } } }), names);
    expect(row).toMatchObject({ title: 'Pago · Nequi', detail: 'Motivo: Error de digitación', badge: { label: 'REVERTIDO', kind: 'neutral' }, reversiblePaymentId: null });
  });

  it('visitas sin pago', () => {
    expect(toVisitRow(visit({ outcome: 'NOT_FOUND', payment: null, collectorMembershipId: 'otro' }), names)).toMatchObject({ title: 'No encontrado', subtitle: '24 sep 2026 · Cobrador', trailing: '' });
    expect(toVisitRow(visit({ outcome: 'REFUSED', payment: null }), names).title).toBe('Se negó a pagar');
    expect(toVisitRow(visit({ outcome: 'RESCHEDULED', payment: null, promisedDate: '2026-09-30' }), names)).toMatchObject({ title: 'Reprogramada', detail: 'Promete pagar el 30 sep 2026' });
    expect(LoanVisitSchema.parse(visit()).id).toBe('v1');
  });
});

describe('mensajes', () => {
  const http = (status: number, code: string | null = null) => ({ kind: 'http', status, code, retryAfterSeconds: null }) as const;
  it.each([
    [{ kind: 'offline' }, /Sin conexión/], [{ kind: 'maintenance' }, /mantenimiento/], [http(409, 'LOAN_NOT_CANCELABLE'), /dejó de estar activo/], [http(403, 'FORBIDDEN'), /permiso/],
    [http(403, 'SUBSCRIPTION_READ_ONLY'), /solo lectura/], [http(404, 'NOT_FOUND'), /ya no existe/], [http(409, 'CONFLICT'), /ya estaba revertido/], [http(429), /Demasiados/], [http(500), /No pudimos/],
  ] as const)('%j', (failure, expected) => {
    expect(loanFailureMessage(failure)).toMatch(expected);
  });

  it('los textos con datos', () => {
    expect(LOANS_COPY.detail.cancelMessage('Ana', '$1.000')).toContain('Ana');
    expect(LOANS_COPY.history.reverseMessage('$5')).toContain('$5');
  });
});
