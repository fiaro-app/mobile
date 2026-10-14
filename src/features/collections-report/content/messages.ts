import type { ReportFilter } from '@/features/collections-report/lib/report-view-model';

/** Textos de "Cobros del día". */
export const REPORT_COPY = {
  title: 'Cobros del día',
  filters: [
    { value: 'all', label: 'Todos' },
    { value: 'paid', label: 'Pagos' },
    { value: 'unpaid', label: 'Sin pago' },
  ] satisfies readonly { value: ReportFilter; label: string }[],
  dateTitle: 'Elige el día',
  emptyTitle: 'Sin cobros ese día',
  emptyMessage: 'No hay visitas registradas en la fecha elegida.',
  loadFailedTitle: 'No pudimos cargar los cobros',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
} as const;
