import { isValidNationalId, validateRequestForm, type RequestFormValues } from '@/features/loan-requests/lib/request-form';

const VALID: RequestFormValues = {
  nationalId: '51.234.567',
  fullName: 'Rosa Pardo',
  phone: '300 111 2233',
  occupation: 'Tendera',
  address: 'Calle 1 # 2-3',
  principal: '500.000',
  count: '20',
  installment: '30.000',
  total: '600.000',
  frequency: 'DAILY',
  startDate: '2026-12-01',
};

describe('isValidNationalId', () => {
  it('acepta 3 a 10 dígitos con separadores y rechaza lo demás', () => {
    expect(isValidNationalId('1.020.304.050')).toBe(true);
    expect(isValidNationalId('0123456')).toBe(false);
    expect(isValidNationalId('12')).toBe(false);
    expect(isValidNationalId('abc')).toBe(false);
  });
});

describe('validateRequestForm', () => {
  it('con un cliente nuevo arma el cuerpo con sus datos y la cédula normalizada', () => {
    const result = validateRequestForm(VALID, true);

    expect(result).toEqual({
      ok: true,
      body: {
        nationalId: '51234567',
        client: { fullName: 'Rosa Pardo', occupation: 'Tendera', phone: '+573001112233', address: 'Calle 1 # 2-3' },
        principalAmount: 500_000,
        installmentCount: 20,
        installmentValue: 30_000,
        totalPayable: 600_000,
        frequency: 'DAILY',
        startDate: '2026-12-01',
      },
    });
  });

  it('con un cliente del negocio no exige ni manda sus datos', () => {
    const result = validateRequestForm({ ...VALID, fullName: '', phone: '', occupation: '', address: '' }, false);

    expect(result.ok && result.body.client).toBeUndefined();
    expect(result.ok).toBe(true);
  });

  it('marca cada campo con problema del cliente nuevo y del préstamo', () => {
    const result = validateRequestForm({ ...VALID, nationalId: '12', fullName: 'A', phone: '123', occupation: ' ', address: ' ', principal: '', count: '', installment: '', total: '', frequency: '', startDate: '' }, true);

    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['address', 'count', 'frequency', 'fullName', 'installment', 'nationalId', 'occupation', 'phone', 'principal', 'startDate', 'total']);
  });

  it('no inventa un error de cliente: ese campo no existe en el formulario', () => {
    const result = validateRequestForm({ ...VALID, principal: '' }, false);

    expect(!result.ok && result.errors).toEqual({ principal: 'Escribe el monto prestado.' });
  });
});
