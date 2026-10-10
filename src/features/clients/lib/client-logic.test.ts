import { clientFailureMessage } from '@/features/clients/content/messages';
import { ClientFormSchema, ClientListItemSchema, toClientBody, toClientChanges } from '@/features/clients/lib/client-schemas';
import { activeLoansLabel, clientBadge, matchesFilter, toClientRow } from '@/features/clients/lib/client-view-model';
import { loanBadge, loanSummary, installmentLabel, toLoanRow } from '@/features/loans/lib/loan-view-model';
import { LoanListItemSchema } from '@/features/loans/lib/loan-schemas';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { act, renderHook } from '@testing-library/react-native';

const item = (over = {}) => ({ id: 'c1', nationalId: '1020304050', fullName: 'Marta Gómez', occupation: 'Comerciante', phone: '+573001112233', address: 'Calle 1', balance: 420000, overdueAmount: 336000, overdueDays: 17, activeLoans: 1, ...over });
const valid = { fullName: 'Marta Gómez', nationalId: '1.020.304.050', phone: '300 111 2233', occupation: 'Comerciante', address: 'Calle 1 # 2-3' };
const loan = (over = {}) => ({ id: 'l1', clientId: 'c1', principalAmount: 1000000, installmentCount: 30, installmentValue: 35000, totalPayable: 1050000, frequency: 'DAILY' as const, startDate: '2026-09-02', status: 'ACTIVE' as const, closedAt: null, balance: 420000, overdueAmount: 105000, overdueDays: 3, nextDueDate: null, ...over });

describe('formulario de cliente', () => {
  it('valida y normaliza', () => {
    expect(ClientFormSchema.safeParse(valid).success).toBe(true);
    for (const [field, value] of [['fullName', 'A'], ['nationalId', '12'], ['phone', '99'], ['occupation', ' '], ['address', '']] as const) {
      expect(ClientFormSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
    }
    expect(toClientBody(valid)).toEqual({ ...valid, nationalId: '1020304050', phone: '+573001112233' });
  });

  it('envía solo lo que cambió', () => {
    const current = { id: 'c1', nationalId: '1020304050', fullName: 'Marta Gómez', occupation: 'Comerciante', phone: '+573001112233', address: 'Calle 1 # 2-3' };
    expect(toClientChanges(valid, current)).toBeNull();
    expect(toClientChanges({ ...valid, address: 'Otra' }, current)).toEqual({ address: 'Otra' });
    expect(toClientChanges({ ...valid, phone: '311 555 0102', occupation: 'Tendera' }, current)).toEqual({ phone: '+573115550102', occupation: 'Tendera' });
  });

  it('valida las respuestas del API', () => {
    expect(ClientListItemSchema.parse(item()).activeLoans).toBe(1);
    expect(() => ClientListItemSchema.parse({ ...item(), balance: 'x' })).toThrow();
    expect(LoanListItemSchema.parse({ ...loan(), collector: { membershipId: 'm', fullName: 'Ana' } }).collector?.fullName).toBe('Ana');
  });
});

describe('lista de clientes', () => {
  it('etiqueta préstamos activos', () => {
    expect(activeLoansLabel(0)).toBe('Sin préstamos activos');
    expect(activeLoansLabel(1)).toBe('1 préstamo');
    expect(activeLoansLabel(3)).toBe('3 préstamos');
  });

  it('el distintivo usa la regla de mora compartida', () => {
    expect(clientBadge({ balance: 0, overdueDays: 0, activeLoans: 0 })).toEqual({ label: 'SIN DEUDA', kind: 'neutral' });
    expect(clientBadge({ balance: 10, overdueDays: 0, activeLoans: 1 }).label).toBe('AL DÍA');
    expect(clientBadge({ balance: 10, overdueDays: 7, activeLoans: 1 }).label).toBe('ATRASO');
    expect(clientBadge({ balance: 10, overdueDays: 8, activeLoans: 1 }).label).toBe('MORA');
  });

  it('filtra por situación de pago', () => {
    const arrears = item();
    const current = item({ overdueDays: 0, overdueAmount: 0 });
    const none = item({ activeLoans: 0, balance: 0, overdueDays: 0 });
    expect([arrears, current, none].map((c) => matchesFilter(c, 'all'))).toEqual([true, true, true]);
    expect([arrears, current, none].map((c) => matchesFilter(c, 'arrears'))).toEqual([true, false, false]);
    expect([arrears, current, none].map((c) => matchesFilter(c, 'current'))).toEqual([false, true, false]);
  });

  it('arma la fila', () => {
    expect(toClientRow(item())).toEqual({ id: 'c1', initials: 'MG', name: 'Marta Gómez', subtitle: 'CC 1020304050 · 300 111 2233', detail: 'Mora 17 días · $336.000', badge: { label: 'MORA', kind: 'bad' }, trailing: 'Saldo $420.000' });
    expect(toClientRow(item({ activeLoans: 0, overdueDays: 0, balance: 0 }))).toMatchObject({ detail: 'Sin préstamos activos', trailing: '' });
  });
});

describe('préstamos', () => {
  it('resume y etiqueta', () => {
    expect(loanSummary(loan())).toBe('$1.000.000 · 30 cuotas diarias');
    expect(loanSummary(loan({ installmentCount: 1, frequency: 'WEEKLY' }))).toBe('$1.000.000 · 1 cuota semanal');
    expect(loanSummary(loan({ frequency: 'BIWEEKLY' }))).toContain('quincenales');
    expect(loanSummary(loan({ frequency: 'MONTHLY' }))).toContain('mensuales');
    expect(installmentLabel(loan())).toBe('$35.000 diaria');
  });

  it('el distintivo respeta estado y mora', () => {
    expect(loanBadge(loan({ status: 'CANCELED' })).label).toBe('ANULADO');
    expect(loanBadge(loan({ status: 'PAID_OFF' })).label).toBe('PAGADO');
    expect(loanBadge(loan({ balance: 0 })).label).toBe('PAGADO');
    expect(loanBadge(loan({ overdueDays: 0 })).label).toBe('AL DÍA');
    expect(loanBadge(loan({ overdueDays: 3 })).label).toBe('ATRASO');
    expect(loanBadge(loan({ overdueDays: 30 })).label).toBe('MORA');
  });

  it('la fila cambia según se liste con o sin el cliente', () => {
    expect(toLoanRow(loan(), null)).toMatchObject({ title: '$1.000.000 · 30 cuotas diarias', subtitle: 'Saldo $420.000 · Cuota $35.000 diaria', detail: '' });
    expect(toLoanRow(loan(), 'Marta Gómez')).toMatchObject({ title: 'Marta Gómez', subtitle: '$1.000.000 · 30 cuotas diarias', detail: 'Saldo $420.000' });
  });
});

describe('mensajes y utilidades', () => {
  const http = (status: number, code: string | null = null) => ({ kind: 'http', status, code, retryAfterSeconds: null }) as const;
  it.each([
    [{ kind: 'offline' }, /Sin conexión/], [{ kind: 'maintenance' }, /mantenimiento/], [http(409, 'CLIENT_NATIONAL_ID_TAKEN'), /esa cédula/], [http(403, 'FORBIDDEN'), /permiso/],
    [http(403, 'SUBSCRIPTION_READ_ONLY'), /solo lectura/], [http(404, 'NOT_FOUND'), /ya no existe/], [http(429), /Demasiados/], [http(500), /No pudimos/],
  ] as const)('%j', (failure, expected) => {
    expect(clientFailureMessage(failure)).toMatch(expected);
  });

  it('el valor con retraso solo cambia al dejar de teclear', async () => {
    jest.useFakeTimers();
    const hook = await renderHook(({ v }: { v: string }) => useDebouncedValue(v, 300), { initialProps: { v: 'a' } });
    await hook.rerender({ v: 'ab' });
    expect(hook.result.current).toBe('a');
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(hook.result.current).toBe('ab');
    jest.useRealTimers();
  });
});
