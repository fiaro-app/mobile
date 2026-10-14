import { suggestTotal, validateLoanForm, type LoanFormValues } from '@/features/loans/lib/loan-form';
import { describeStartDate } from '@/features/loans/lib/start-dates';

const valid: LoanFormValues = { clientId: 'c1', principal: '1.000.000', count: '30', installment: '35.000', total: '1.050.000', frequency: 'DAILY', startDate: '2026-10-09', collectorId: '' };

describe('validación de "Nuevo préstamo"', () => {
  it('arma el cuerpo del API', () => {
    expect(validateLoanForm(valid)).toEqual({ ok: true, body: { clientId: 'c1', principalAmount: 1000000, installmentCount: 30, installmentValue: 35000, totalPayable: 1050000, frequency: 'DAILY', startDate: '2026-10-09' } });
  });

  it('marca cada campo faltante', () => {
    const result = validateLoanForm({ ...valid, clientId: '', principal: '', count: '', installment: '', total: '', frequency: '', startDate: '' });
    expect(result.ok).toBe(false);
    expect(result.ok ? [] : Object.keys(result.errors)).toEqual(['clientId', 'principal', 'count', 'installment', 'total', 'frequency', 'startDate']);
  });

  it('valida el rango de cuotas', () => {
    const errorOf = (count: string) => {
      const result = validateLoanForm({ ...valid, count });
      return result.ok ? null : result.errors.count;
    };
    expect(errorOf('0')).toMatch(/al menos 1/);
    expect(errorOf('1001')).toMatch(/1000/);
    expect(errorOf('1000')).toBeNull();
    expect(errorOf('abc')).toMatch(/número de cuotas/);
  });

  it('sugiere el total', () => {
    expect(suggestTotal(30, 35000)).toBe(1050000);
    expect(suggestTotal(null, 35000)).toBeNull();
    expect(suggestTotal(0, 35000)).toBeNull();
    expect(suggestTotal(3, 0)).toBeNull();
  });
});

describe('fecha de inicio', () => {
  it('marca hoy y mañana, y cruza de mes sin correrse un día', () => {
    expect(describeStartDate('2026-10-09', '2026-10-09')).toBe('Hoy · vie 9 oct');
    expect(describeStartDate('2026-10-10', '2026-10-09')).toBe('Mañana · sáb 10 oct');
    expect(describeStartDate('2026-10-02', '2026-10-09')).toBe('vie 2 oct');
    expect(describeStartDate('2026-11-01', '2026-10-31')).toBe('Mañana · dom 1 nov');
  });
});
