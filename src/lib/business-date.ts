const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const;

/** Zona horaria de negocio de Fiaro: el API calcula las fechas de cobro en hora de Colombia (sin horario de verano). */
const BUSINESS_TIME_ZONE = 'America/Bogota';

/**
 * Fecha de negocio (`AAAA-MM-DD`) de un instante, en hora de Colombia. Un cobro hecho a las 8 p. m. en
 * Bogotá ya es "mañana" en UTC; usar la fecha UTC lo pondría en el día equivocado, igual que el
 * `startDate` como texto del API evita esa clase de errores.
 *
 * @param instant - Instante a convertir; por defecto, ahora.
 */
export function businessDateOf(instant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

/**
 * Da formato corto a una fecha `AAAA-MM-DD` o a un instante ISO (`12 sep 2026`). Los meses van escritos a
 * mano y no con `Intl`, para que se vean igual en Android, iOS y web.
 */
export function formatShortDate(value: string): string {
  const date = value.length > 10 ? businessDateOf(new Date(value)) : value;
  const [year, month, day] = date.split('-');
  const name = MONTHS[Number(month) - 1];
  return name ? `${String(Number(day))} ${name} ${year ?? ''}` : value;
}

/**
 * Una fecha `AAAA-MM-DD` como `lun 12`: el día de la semana y el número, para leer una gráfica sin contar días. Se arma a
 * mediodía UTC sobre el texto para que la zona horaria no corra el día; devuelve el texto tal cual si no es una fecha.
 */
export function formatWeekdayDay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const weekday = new Date(`${value}T12:00:00Z`).getUTCDay();
  return `${WEEKDAYS[weekday] ?? ''} ${String(Number(match[3]))}`;
}
