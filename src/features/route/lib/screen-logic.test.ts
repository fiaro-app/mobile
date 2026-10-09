import { emptyContentFor } from '@/features/route/content/empty-content';
import { toRowViewModel } from '@/features/route/lib/row-view-model';

const base = { loanId: 'l1', clientId: 'c1', clientFullName: 'Marta Gómez', balance: 420000, overdueAmount: 90000, overdueDays: 12, nextDueDate: null };

describe('toRowViewModel', () => {
  it('formatea nombre, saldo, estado y días', () => {
    expect(toRowViewModel(base)).toEqual({
      id: 'l1',
      name: 'Marta Gómez',
      initials: 'MG',
      balanceLabel: '$420.000',
      status: 'overdue',
      daysLabel: '12 días',
      daysAlert: true,
    });
  });

  it('un préstamo al día no marca los días en rojo', () => {
    expect(toRowViewModel({ ...base, overdueAmount: 0, overdueDays: 0 })).toMatchObject({ status: 'on-time', daysLabel: '0 días', daysAlert: false });
  });

  it('un préstamo pagado no está en alerta', () => {
    expect(toRowViewModel({ ...base, balance: 0, overdueDays: 4 })).toMatchObject({ status: 'paid', daysAlert: false });
  });
});

describe('emptyContentFor', () => {
  it('distingue sin resultados de sin clientes', () => {
    expect(emptyContentFor('empty', true).title).toBe('Sin resultados');
    expect(emptyContentFor('empty', false).title).toBe('Sin clientes asignados hoy');
  });

  it('los fallos recuperables ofrecen reintentar y el 403 no', () => {
    expect(emptyContentFor('offline', false).actionLabel).toBe('Reintentar');
    expect(emptyContentFor('maintenance', false).actionLabel).toBe('Reintentar');
    expect(emptyContentFor('error', false).actionLabel).toBe('Reintentar');
    expect(emptyContentFor('forbidden', false).actionLabel).toBeUndefined();
  });
});
