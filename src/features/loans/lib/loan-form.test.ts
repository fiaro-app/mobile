import { suggestTotal, validateLoanForm, type LoanFormValues } from '@/features/loans/lib/loan-form';
import { startDateOptions } from '@/features/loans/lib/start-dates';

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

describe('fechas de inicio', () => {
  it('ofrece 7 días atrás y 14 adelante, con hoy y mañana marcados', () => {
    const options = startDateOptions('2026-10-09');
    expect(options).toHaveLength(22);
    expect(options[0]).toEqual({ value: '2026-10-02', label: 'vie 2 oct' });
    expect(options[7]).toEqual({ value: '2026-10-09', label: 'Hoy · vie 9 oct' });
    expect(options[8]?.label).toBe('Mañana · sáb 10 oct');
    expect(options.at(-1)?.value).toBe('2026-10-23');
  });

  it('cruza de mes sin correrse un día', () => {
    expect(startDateOptions('2026-10-31', 0, 1).map((option) => option.value)).toEqual(['2026-10-31', '2026-11-01']);
  });
});
