import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { fetchReport } from '@/features/collections-report/api/report-api';
import { useReportScreen } from '@/features/collections-report/hooks/use-report-screen';
import { ReportPageSchema } from '@/features/collections-report/lib/report-schemas';
import { timeOf, toReportRow, totalCollected } from '@/features/collections-report/lib/report-view-model';
import * as apiModule from '@/features/collections-report/api/report-api';
import { authedRequest } from '@/lib/http/authed-request';

jest.mock('@/lib/http/authed-request', () => ({ authedRequest: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/business-date', () => ({ ...jest.requireActual('@/lib/business-date'), businessDateOf: () => '2026-10-09' }));

const entry = (id: string, over = {}) => ({
  visitId: id, occurredAt: '2026-10-09T21:12:00Z', outcome: 'PAID' as const, expectedAmount: 35000, promisedDate: null, loan: { id: `l-${id}` }, client: { id: 'c', fullName: 'Marta Gómez' }, collector: { membershipId: 'm', fullName: 'Ana Gómez' },
  payment: { id: 'p', amount: 35000, method: 'NEQUI' as const, reversed: false }, ...over,
});
const request = jest.mocked(authedRequest);

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('lógica del reporte', () => {
  it('arma la fila de un pago, un pago revertido y una visita sin pago', () => {
    expect(toReportRow(entry('1'))).toEqual({ id: '1', loanId: 'l-1', title: 'Marta Gómez', subtitle: 'Ana Gómez · 9 oct, 4:12 p. m.', detail: 'Nequi', badge: null, trailing: '$35.000' });
    expect(toReportRow(entry('2', { payment: { id: 'p', amount: 1000, method: 'CASH', reversed: true } })).badge).toEqual({ label: 'REVERTIDO', kind: 'neutral' });
    expect(toReportRow(entry('3', { outcome: 'NOT_FOUND', payment: null }))).toMatchObject({ detail: 'No encontrado', trailing: '' });
    expect(toReportRow(entry('4', { outcome: 'RESCHEDULED', payment: null, promisedDate: '2026-10-12' })).detail).toBe('Reprogramada al 12 oct 2026');
    expect(toReportRow(entry('5', { outcome: 'REFUSED', payment: null })).detail).toBe('Se negó a pagar');
    expect(timeOf('2026-10-09T13:05:00Z')).toBe('8:05 a. m.');
  });

  it('suma lo cobrado sin los pagos revertidos', () => {
    expect(totalCollected([entry('1'), entry('2', { payment: { id: 'p', amount: 99, method: 'CASH', reversed: true } }), entry('3', { payment: null, outcome: 'REFUSED' })])).toBe(35000);
  });

  it('valida el API y manda solo los filtros elegidos', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchReport(1, { range: { from: '2026-10-01', to: '2026-10-09' }, outcome: 'PAID', collectorId: 'm1' });
    await fetchReport(2, { range: null, outcome: null, collectorId: null });
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 10, dateRange: { from: '2026-10-01', to: '2026-10-09' }, outcome: 'PAID', collectorMembershipId: 'm1' } });
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 2, pageSize: 10 } });
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ data: [entry('1')], meta: { total: 3 }, range: { from: 'a', to: 'b' } })).toEqual({ items: [entry('1')], total: 3 });
    expect(() => ReportPageSchema.parse({})).toThrow();
    expect(apiModule.REPORT_PAGE_SIZE).toBe(10);
  });
});

describe('useReportScreen', () => {
  it('carga hoy, resume y filtra en la API', async () => {
    request.mockImplementation((_path, parse) => Promise.resolve({ ok: true, value: (parse as (b: unknown) => unknown)({ data: [entry('1'), entry('2', { outcome: 'REFUSED', payment: null })], meta: { total: 2 }, range: { from: 'a', to: 'b' } }) }) as never);
    const { result } = await renderHook(() => useReportScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    expect(result.current.summary).toBe('2 visitas · Cobrado $35.000');
    await act(async () => {
      result.current.setFilter('REFUSED');
    });
    await waitFor(() => {
      expect(request.mock.calls.at(-1)?.[2]).toMatchObject({ body: { outcome: 'REFUSED' } });
    });
  });

  it('cambia el rango y el cobrador, y pide más páginas', async () => {
    let call = 0;
    request.mockImplementation((_path, parse) => {
      call += 1;
      return Promise.resolve({ ok: true, value: (parse as (b: unknown) => unknown)({ data: [entry(String(call))], meta: { total: 3 }, range: { from: 'a', to: 'b' } }) }) as never;
    });
    const { result } = await renderHook(() => useReportScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
    expect(result.current.summary).toContain('(hasta ahora)');
    await act(async () => {
      result.current.loadMore();
    });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    await act(async () => {
      result.current.dates.open('from');
    });
    await act(async () => {
      result.current.dates.pick('2026-10-01');
    });
    await waitFor(() => {
      expect(request.mock.calls.at(-1)?.[2]).toMatchObject({ body: { dateRange: { from: '2026-10-01', to: '2026-10-01' } } });
    });
    await act(async () => {
      result.current.collector.openSheet();
    });
    expect(result.current.collector.open).toBe(true);
    await act(async () => {
      result.current.collector.select('m9');
    });
    expect(result.current.collector.open).toBe(false);
    await waitFor(() => {
      expect(request.mock.calls.at(-1)?.[2]).toMatchObject({ body: { collectorMembershipId: 'm9' } });
    });
    await act(async () => {
      result.current.collector.openSheet();
      result.current.collector.closeSheet();
    });
  });

  it('marca el fallo y refresca', async () => {
    request.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useReportScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.failed).toBe(true);
    });
    await act(async () => {
      result.current.refresh();
    });
  });
});
