import type { ReportFilter } from '@/features/collections-report/lib/report-view-model';

/** Textos de "Cobros del día". */
export const REPORT_COPY = {
  title: 'Cobros del día',
  filters: [
    { value: 'all', label: 'Todos' },
    { value: 'PAID', label: 'Pagó' },
    { value: 'NOT_FOUND', label: 'No encontrado' },
    { value: 'REFUSED', label: 'Se negó' },
    { value: 'RESCHEDULED', label: 'Reprogramado' },
  ] satisfies readonly { value: ReportFilter; label: string }[],
  fromTitle: 'Desde',
  toTitle: 'Hasta',
  periodHint: 'Sin fechas se ve solo hoy. Hasta 93 días.',
  collectorTitle: 'Cobrador',
  allCollectors: 'Todos los cobradores',
  emptyTitle: 'Sin cobros',
  emptyMessage: 'No hay visitas registradas con estos filtros.',
  loadFailedTitle: 'No pudimos cargar los cobros',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
} as const;
