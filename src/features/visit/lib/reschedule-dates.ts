import { formatShortDate } from '@/lib/business-date';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
const DAY_MS = 86_400_000;

/** Una fecha que el cobrador puede elegir al reprogramar: valor `AAAA-MM-DD` y texto ("Jueves, 24/09/2026"). */
export interface DateOption {
  readonly value: string;
  readonly label: string;
}

function isoOf(base: Date, plusDays: number): string {
  return new Date(base.getTime() + plusDays * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Fechas a elegir al reprogramar: los próximos `count` días a partir de mañana. Se calculan sobre la
 * fecha de negocio de hoy (en hora de Colombia, no UTC) usando mediodía UTC para que el cambio de
 * horario o de zona nunca corra un día. No se ofrece hoy: reprogramar es moverla a otro día.
 *
 * @param today - Fecha de negocio de hoy `AAAA-MM-DD`.
 * @param count - Cuántos días ofrecer (por defecto 14).
 */
export function rescheduleOptions(today: string, count = 14): DateOption[] {
  const base = new Date(`${today}T12:00:00Z`);
  return Array.from({ length: count }, (_, index) => {
    const value = isoOf(base, index + 1);
    const date = new Date(`${value}T12:00:00Z`);
    const [year, month, day] = value.split('-');
    return { value, label: `${DAY_NAMES[date.getUTCDay()] ?? ''}, ${day ?? ''}/${month ?? ''}/${year ?? ''}` };
  });
}

/** Texto corto de una fecha elegida (`24 sep 2026`), para el aviso de confirmación. */
export function shortDateLabel(value: string): string {
  return formatShortDate(value);
}
