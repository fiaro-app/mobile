import type { LoanRequest } from '@/features/loan-requests/lib/request-schemas';
import { toRequestDetail, toRequestRow, UNKNOWN_CLIENT, UNKNOWN_COLLECTOR } from '@/features/loan-requests/lib/request-view-model';

const NEW: LoanRequest = {
  id: 'r1',
  status: 'PENDING',
  requestedByMembershipId: 'm1',
  clientId: null,
  nationalId: '51234567',
  newClient: { fullName: 'Rosa Pardo', occupation: 'Tendera', phone: '+573001112233', address: 'Calle 1' },
  principalAmount: 500_000,
  installmentCount: 20,
  installmentValue: 30_000,
  totalPayable: 600_000,
  frequency: 'DAILY',
  startDate: '2026-12-01',
  resolvedAt: null,
  rejectionReason: null,
  loanId: null,
  createdAt: '2026-10-15T12:00:00Z',
};
const EXISTING: LoanRequest = { ...NEW, id: 'r2', clientId: 'c1', newClient: null };

describe('toRequestRow', () => {
  it('muestra al cliente nuevo, quién lo sugirió y el estado', () => {
    const row = toRequestRow(NEW, new Map([['m1', 'Luis Gómez']]));

    expect(row).toMatchObject({ id: 'r1', title: 'Rosa Pardo', amount: '$500.000', badge: { label: 'PENDIENTE', kind: 'warning' } });
    expect(row.subtitle).toContain('Luis Gómez');
  });

  it('para un cliente del negocio muestra la cédula y un cobrador sin nombre si no se conoce', () => {
    const row = toRequestRow(EXISTING, new Map());

    expect(row.title).toBe(`${UNKNOWN_CLIENT} · 51234567`);
    expect(row.subtitle).toContain(UNKNOWN_COLLECTOR);
  });
});

describe('toRequestDetail', () => {
  it('lista los datos del cliente nuevo y las condiciones, y se puede resolver mientras está pendiente', () => {
    const detail = toRequestDetail(NEW, 'Luis Gómez');

    expect(detail).toMatchObject({ collectorName: 'Luis Gómez', reviewable: true, rejectionNote: null, summary: '$500.000 en 20 cuotas de $30.000' });
    expect(detail.rows.map((row) => row.label)).toEqual(['Cliente', 'Cédula', 'Celular', 'Oficio', 'Dirección', 'Monto', 'Cuotas', 'Total a pagar', 'Frecuencia', 'Empieza', 'Enviada']);
    expect(detail.rows[0]?.value).toBe('Rosa Pardo (nuevo)');
    expect(detail.rows.find((row) => row.label === 'Frecuencia')?.value).toBe('Diaria');
  });

  it('para un cliente del negocio no muestra datos personales', () => {
    const detail = toRequestDetail(EXISTING, 'Luis Gómez');

    expect(detail.rows.map((row) => row.label)).not.toContain('Celular');
    expect(detail.rows[0]?.value).toBe(UNKNOWN_CLIENT);
  });

  it('una solicitud rechazada ya no se resuelve y muestra su motivo', () => {
    const detail = toRequestDetail({ ...NEW, status: 'REJECTED', rejectionReason: 'Está en mora' }, 'Luis Gómez');

    expect(detail).toMatchObject({ reviewable: false, rejectionNote: 'Está en mora', badge: { kind: 'bad' } });
  });
});
