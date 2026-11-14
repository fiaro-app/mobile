import { z } from 'zod';

const FiguresSchema = z.object({
  totalPortfolio: z.int(),
  portfolioAtRisk: z.int(),
  arrearsRate: z.number().nullable(),
  expectedAmount: z.int(),
  collectedAmount: z.int(),
  effectiveness: z.number().nullable(),
});

/** Respuesta de `QUERY /lenders/me/consolidated-stats` (D-155 del API, plan Team). */
export const ConsolidatedSchema = z.object({
  from: z.string(),
  to: z.string(),
  lenders: z.array(FiguresSchema.extend({ lenderId: z.string(), name: z.string() })),
  totals: FiguresSchema,
});
export type Consolidated = z.infer<typeof ConsolidatedSchema>;
