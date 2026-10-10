import { z } from 'zod';

const PrevSchema = z.object({
  totalPortfolio: z.int(),
  portfolioAtRisk: z.int(),
  arrearsRate: z.number().nullable(),
  collectedAmount: z.int(),
  effectiveness: z.number().nullable(),
});

/** Respuesta de `QUERY /lenders/me/stats`: cartera en riesgo, mora por antigüedad y desempeño por cobrador, con el período anterior. */
export const LenderStatsSchema = z.object({
  from: z.string(),
  to: z.string(),
  totalPortfolio: z.int(),
  portfolioAtRisk: z.int(),
  arrearsRate: z.number().nullable(),
  arrearsByAge: z.array(z.object({ label: z.enum(['0-7', '8-15', '16-30', '30+']), amount: z.int(), clientsCount: z.int() })),
  topArrears: z.array(z.object({ clientId: z.string(), clientFullName: z.string(), overdueDays: z.int(), overdueAmount: z.int() })),
  collectorPerformance: z.array(z.object({ collectorMembershipId: z.string(), fullName: z.string(), effectiveness: z.number().nullable(), overdueAmount: z.int() })),
  expectedAmount: z.int(),
  collectedAmount: z.int(),
  effectiveness: z.number().nullable(),
  previous: PrevSchema.nullable(),
});
export type LenderStats = z.infer<typeof LenderStatsSchema>;
