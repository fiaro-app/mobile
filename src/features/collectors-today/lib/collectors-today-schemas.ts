import { z } from 'zod';

const SettlementStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

/**
 * Respuesta de `GET /lenders/me/collectors-today`: cómo va hoy la ruta de cada cobrador activo.
 * Copia local de `CollectorsTodayResponseSchema` del API.
 */
export const CollectorsTodaySchema = z.object({
  date: z.string(),
  counts: z.object({ NO_ROUTE: z.number(), NOT_STARTED: z.number(), IN_PROGRESS: z.number(), FINISHED: z.number() }),
  collectors: z.array(
    z.object({
      membershipId: z.string(),
      fullName: z.string(),
      status: z.enum(['NO_ROUTE', 'NOT_STARTED', 'IN_PROGRESS', 'FINISHED']),
      routeLoans: z.number().int(),
      visitedLoans: z.number().int(),
      pendingLoans: z.number().int(),
      expectedAmount: z.number().int(),
      collectedAmount: z.number().int(),
      firstVisitAt: z.string().nullable(),
      lastVisitAt: z.string().nullable(),
      settlementStatus: SettlementStatus.nullable(),
    }),
  ),
});
export type CollectorsToday = z.infer<typeof CollectorsTodaySchema>;
