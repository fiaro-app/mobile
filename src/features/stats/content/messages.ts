import type { Period } from '@/features/stats/lib/period-range';

/** Textos de "Estadísticas". */
export const STATS_COPY = {
  title: 'Estadísticas',
  periods: [
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'year', label: 'Año' },
  ] satisfies readonly { value: Period; label: string }[],
  collected: 'Cobrado',
  expected: 'Esperado',
  effectiveness: 'Efectividad',
  visits: 'Visitas',
  overdue: 'Cartera vencida',
  overdueHint: 'Lo vencido y sin pagar hoy, de tu cartera',
  loadFailedTitle: 'No pudimos cargar tus estadísticas',
  loadFailedMessage: 'Revisa tu conexión e intenta de nuevo.',
} as const;
