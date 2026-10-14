import { z } from 'zod';
import { ByMethodSchema, SettlementStatusSchema } from '@/features/settlement/lib/settlement-schemas';

/** Cuadre completo, como lo ve quien lo revisa. */
export const ReviewSettlementSchema = z.object({
  id: z.string(),
  collectorMembershipId: z.string(),
  date: z.string(),
  expectedAmount: z.int(),
  collectedAmount: z.int(),
  collectedByMethod: ByMethodSchema,
  status: SettlementStatusSchema,
  collectorNote: z.string().nullable(),
  reviewNote: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  submittedAt: z.string(),
});
export type ReviewSettlement = z.infer<typeof ReviewSettlementSchema>;

/** Página de cuadres. */
export const ReviewSettlementsPageSchema = z.object({ data: z.array(ReviewSettlementSchema), meta: z.object({ total: z.number() }) });
