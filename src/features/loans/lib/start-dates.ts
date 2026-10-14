import type { DateOption } from '@/features/visit/lib/reschedule-dates';

const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const DAY_MS = 86_400_000;

/**
 * Fechas de inicio a elegir: de 7 días atrás a 14 adelante, con "Hoy" y "Mañana" marcados. Se calculan sobre la fecha
 * de negocio (hora de Colombia) a mediodía UTC para que el cambio de zona nunca corra un día. Evita un calendario nativo
 * y fechas disparatadas; una fecha de inicio fuera de ese rango no se ofrece todavía.
 *
 * @param today - Fecha de negocio de hoy `AAAA-MM-DD`.
 */
export function startDateOptions(today: string, daysBack = 7, daysAhead = 14): DateOption[] {
  const base = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: daysBack + daysAhead + 1 }, (_, index) => {
    const offset = index - daysBack;
    const date = new Date(base.getTime() + offset * DAY_MS);
    const value = date.toISOString().slice(0, 10);
    const text = `${DAY_NAMES[date.getUTCDay()] ?? ''} ${String(date.getUTCDate())} ${MONTHS[date.getUTCMonth()] ?? ''}`;
    let label = text;
    if (offset === 0) label = `Hoy · ${text}`;
    else if (offset === 1) label = `Mañana · ${text}`;
    return { value, label };
  });
}
