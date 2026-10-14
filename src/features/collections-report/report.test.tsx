import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { fetchReport } from '@/features/collections-report/api/report-api';
import { useReportScreen } from '@/features/collections-report/hooks/use-report-screen';
import { ReportPageSchema } from '@/features/collections-report/lib/report-schemas';
import { matchesReport, timeOf, toReportRow, totalCollected } from '@/features/collections-report/lib/report-view-model';
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
  it('filtra por pago', () => {
    expect([entry('1'), entry('2', { outcome: 'REFUSED', payment: null })].map((e) => [matchesReport(e, 'all'), matchesReport(e, 'paid'), matchesReport(e, 'unpaid')])).toEqual([[true, true, false], [true, false, true]]);
  });

  it('arma la fila de un pago, un pago revertido y una visita sin pago', () => {
    expect(toReportRow(entry('1'))).toEqual({ id: '1', loanId: 'l-1', title: 'Marta Gómez', subtitle: 'Ana Gómez · 4:12 p. m.', detail: 'Nequi', badge: null, trailing: '$35.000' });
    expect(toReportRow(entry('2', { payment: { id: 'p', amount: 1000, method: 'CASH', reversed: true } })).badge).toEqual({ label: 'REVERTIDO', kind: 'neutral' });
    expect(toReportRow(entry('3', { outcome: 'NOT_FOUND', payment: null }))).toMatchObject({ detail: 'No encontrado', trailing: '' });
    expect(toReportRow(entry('4', { outcome: 'RESCHEDULED', payment: null, promisedDate: '2026-10-12' })).detail).toBe('Reprogramada al 12 oct 2026');
    expect(toReportRow(entry('5', { outcome: 'REFUSED', payment: null })).detail).toBe('Se negó a pagar');
    expect(timeOf('2026-10-09T13:05:00Z')).toBe('8:05 a. m.');
  });

  it('suma lo cobrado sin los pagos revertidos', () => {
    expect(totalCollected([entry('1'), entry('2', { payment: { id: 'p', amount: 99, method: 'CASH', reversed: true } }), entry('3', { payment: null, outcome: 'REFUSED' })])).toBe(35000);
  });

  it('valida el API y pide un solo día', async () => {
    request.mockResolvedValue({ ok: true, value: {} });
    await fetchReport(1, '2026-10-09', true);
    await fetchReport(2, '2026-10-09', false);
    expect(request.mock.calls[0]?.[2]).toEqual({ method: 'QUERY', body: { page: 1, pageSize: 10, dateRange: { from: '2026-10-09', to: '2026-10-09' }, outcome: 'PAID' } });
    expect(request.mock.calls[1]?.[2]).toEqual({ method: 'QUERY', body: { page: 2, pageSize: 10, dateRange: { from: '2026-10-09', to: '2026-10-09' } } });
    const parse = request.mock.calls[0]?.[1] as (body: unknown) => unknown;
    expect(parse({ data: [entry('1')], meta: { total: 3 }, range: { from: 'a', to: 'b' } })).toEqual({ items: [entry('1')], total: 3 });
    expect(() => ReportPageSchema.parse({})).toThrow();
    expect(apiModule.REPORT_PAGE_SIZE).toBe(10);
  });
});

describe('useReportScreen', () => {
  it('carga hoy, resume y filtra', async () => {
    request.mockImplementation((_path, parse) => Promise.resolve({ ok: true, value: (parse as (b: unknown) => unknown)({ data: [entry('1'), entry('2', { outcome: 'REFUSED', payment: null })], meta: { total: 2 }, range: { from: 'a', to: 'b' } }) }) as never);
    const { result } = await renderHook(() => useReportScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    expect(result.current).toMatchObject({ dateLabel: 'Hoy · 9 oct 2026', summary: '2 visitas · Cobrado $35.000' });
    await act(async () => {
      result.current.setFilter('unpaid');
    });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(1);
    });
  });

  it('cambia de día con la hoja y pide más páginas', async () => {
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
      result.current.openSheet();
    });
    expect(result.current.sheetOpen).toBe(true);
    expect(result.current.dateOptions[0]?.value).toBe('2026-10-09');
    await act(async () => {
      result.current.setDate('2026-10-08');
    });
    expect(result.current).toMatchObject({ sheetOpen: false, dateLabel: '8 oct 2026' });
    await act(async () => {
      result.current.openSheet();
      result.current.closeSheet();
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
