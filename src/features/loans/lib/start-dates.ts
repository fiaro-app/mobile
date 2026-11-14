const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;
const DAY_MS = 86_400_000;

/**
 * Texto de la fecha de inicio elegida en el calendario: «vie 9 oct», con «Hoy» o «Mañana» delante cuando aplica. Se calcula a
 * mediodía UTC sobre la fecha de negocio para que el cambio de zona nunca corra un día.
 *
 * @param value - La fecha elegida `AAAA-MM-DD`.
 * @param today - Fecha de negocio de hoy `AAAA-MM-DD`.
 */
export function describeStartDate(value: string, today: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  const text = `${DAY_NAMES[date.getUTCDay()] ?? ''} ${String(date.getUTCDate())} ${MONTHS[date.getUTCMonth()] ?? ''}`;
  const offset = Math.round((date.getTime() - new Date(`${today}T12:00:00Z`).getTime()) / DAY_MS);
  if (offset === 0) return `Hoy · ${text}`;
  return offset === 1 ? `Mañana · ${text}` : text;
}
