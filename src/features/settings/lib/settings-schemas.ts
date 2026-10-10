import { z } from 'zod';

/** Días de la semana, en el orden y con los nombres del API. */
export const WeekdaySchema = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
export type Weekday = z.infer<typeof WeekdaySchema>;

/** Datos del prestamista que se configuran (`GET/PATCH /lender`). */
export const LenderSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
  nonWorkingWeekdays: z.array(WeekdaySchema),
  skipNationalHolidays: z.boolean(),
});
export type LenderSettings = z.infer<typeof LenderSettingsSchema>;

/** Cuerpo de `PATCH /lender`: solo los campos que cambian. */
export interface LenderPatch {
  readonly name?: string;
  readonly brandColor?: string | null;
  readonly nonWorkingWeekdays?: readonly Weekday[];
  readonly skipNationalHolidays?: boolean;
}

/** Cartera del prestamista. */
export const PortfolioSchema = z.object({ id: z.string(), name: z.string(), isDefault: z.boolean() });
export type Portfolio = z.infer<typeof PortfolioSchema>;

/** Plan del negocio (`GET /subscription`): solo informa. */
export const SubscriptionSchema = z.object({
  planCode: z.string(),
  status: z.enum(['ACTIVE', 'GRACE_PERIOD', 'READ_ONLY']),
  currentPeriodEndsAt: z.string(),
  daysRemaining: z.int(),
  graceDaysRemaining: z.int(),
  isReadOnly: z.boolean(),
  limits: z.object({ maxCollectors: z.int() }),
  usage: z.object({ activeCollectors: z.int() }),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

/** Orden y nombre de los días de la semana. */
export const WEEKDAYS: readonly { value: Weekday; label: string }[] = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

/** Agrega o quita un día, devolviendo siempre la lista en el orden de la semana. */
export function toggleWeekday(current: readonly Weekday[], day: Weekday, checked: boolean): Weekday[] {
  const next = new Set(current);
  if (checked) next.add(day);
  else next.delete(day);
  return WEEKDAYS.map((weekday) => weekday.value).filter((weekday) => next.has(weekday));
}

/** `true` si las dos listas tienen los mismos días (sin importar el orden). */
export function sameWeekdays(a: readonly Weekday[], b: readonly Weekday[]): boolean {
  return a.length === b.length && a.every((day) => b.includes(day));
}
