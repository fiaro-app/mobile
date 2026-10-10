import { z } from 'zod';
import { ByMethodSchema, SettlementStatusSchema } from '@/features/settlement/lib/settlement-schemas';

/** Cuadre pendiente que trae el resumen. */
export const DashboardSettlementSchema = z.object({
  id: z.string(),
  date: z.string(),
  status: SettlementStatusSchema,
  collectorMembershipId: z.string(),
  expectedAmount: z.int(),
  collectedAmount: z.int(),
  collectedByMethod: ByMethodSchema,
  collectorNote: z.string().nullable(),
});

/** Respuesta de `GET /lenders/me/dashboard`. */
export const DashboardSchema = z.object({
  totalPortfolio: z.int(),
  collectedToday: z.int(),
  activeCollectors: z.int(),
  totalCollectors: z.int(),
  effectivenessToday: z.number().nullable(),
  clientsInArrears: z.int(),
  alerts: z.array(z.string()),
  pendingSettlements: z.array(DashboardSettlementSchema),
});
export type Dashboard = z.infer<typeof DashboardSchema>;
