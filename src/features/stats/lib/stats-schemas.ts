import { z } from 'zod';

/** Respuesta de `QUERY /collectors/me/stats`: totales del cobrador en un período. */
export const PeriodStatsSchema = z.object({
  from: z.string(),
  to: z.string(),
  expectedAmount: z.int().nonnegative(),
  collectedAmount: z.int().nonnegative(),
  effectiveness: z.number().nonnegative().nullable(),
  visitsCount: z.int().nonnegative(),
  overdueAmount: z.int().nonnegative(),
});
export type PeriodStats = z.infer<typeof PeriodStatsSchema>;

/** Rango de fechas de negocio `AAAA-MM-DD`, ambos extremos incluidos. */
export interface DateRange {
  readonly from: string;
  readonly to: string;
}
