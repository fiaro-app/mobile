import { z } from 'zod';

/** Lo que hizo un cobrador en un día (D-143 de la API). */
export const RouteDaySchema = z.object({
  date: z.string(),
  collector: z.object({ membershipId: z.string(), fullName: z.string() }),
  startedAt: z.string(),
  endedAt: z.string(),
  visitsCount: z.int(),
  paidCount: z.int(),
  expectedAmount: z.int(),
  collectedAmount: z.int(),
});
export type RouteDay = z.infer<typeof RouteDaySchema>;

/** Página del registro de rutas. */
export const RoutesPageSchema = z.object({ data: z.array(RouteDaySchema), meta: z.object({ total: z.number() }) });
