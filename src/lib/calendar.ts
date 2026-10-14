/**
 * Utilidades del calendario (portadas de la web, `web/src/lib/calendar.ts`). Todo trabaja con fechas ISO `AAAA-MM-DD`
 * y aritmética en UTC, así el día no se corre por la zona horaria del teléfono. Los nombres de los meses van escritos a
 * mano, no con `Intl`, para que se vean igual en Android, iOS y web.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Letras de los días, de lunes a domingo (como en Colombia). */
export const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

/** Fecha ISO a `Date` en UTC; `null` si no es una fecha de calendario real (p. ej. `2026-02-30`). */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const sameDay = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return sameDay ? date : null;
}

/** `Date` en UTC a `AAAA-MM-DD`. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Suma (o resta) días a una fecha ISO. */
export function addDays(value: string, days: number): string {
  const date = parseIsoDate(value) ?? new Date(0);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Suma (o resta) meses al primer día del mes de una fecha. */
export function addMonths(monthStart: string, months: number): string {
  const date = parseIsoDate(startOfMonth(monthStart)) ?? new Date(0);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toIsoDate(date);
}

/** Primer día (`AAAA-MM-01`) del mes de una fecha. */
export function startOfMonth(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

/** Las seis semanas (42 días) que pinta el calendario de un mes, empezando en lunes. */
export function monthGrid(monthStart: string): readonly string[] {
  const first = parseIsoDate(startOfMonth(monthStart)) ?? new Date(0);
  const offset = (first.getUTCDay() + 6) % 7;
  const start = toIsoDate(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index - offset));
}

/** «Octubre 2026». */
export function monthLabel(value: string): string {
  const name = MONTH_NAMES[Number(value.slice(5, 7)) - 1];
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)} ${value.slice(0, 4)}` : '';
}

/** «9 de octubre de 2026», para el nombre accesible de un día. */
export function dayLabel(value: string): string {
  const name = MONTH_NAMES[Number(value.slice(5, 7)) - 1];
  return name && parseIsoDate(value) ? `${String(Number(value.slice(8, 10)))} de ${name} de ${value.slice(0, 4)}` : '';
}

/** `2026-10-09` → `09/10/2026`; vacío si no es una fecha válida. */
export function formatDisplayDate(value: string): string {
  if (!parseIsoDate(value)) return '';
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}

/** Días que abarca un rango, contando ambos extremos (igual que `daysInRange` del contrato). */
export function daysInRange(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
}
