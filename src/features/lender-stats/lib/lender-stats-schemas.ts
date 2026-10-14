import { z } from 'zod';

const PrevSchema = z.object({
  totalPortfolio: z.int(),
  portfolioAtRisk: z.int(),
  arrearsRate: z.number().nullable(),
  collectedAmount: z.int(),
  effectiveness: z.number().nullable(),
});

/** Un cliente del ranking de mayor mora. */
export const TopArrearsEntrySchema = z.object({ clientId: z.string(), clientFullName: z.string(), overdueDays: z.int(), overdueAmount: z.int() });
export type TopArrearsEntry = z.infer<typeof TopArrearsEntrySchema>;

/** El desempeño de un cobrador en el período. */
export const CollectorPerformanceSchema = z.object({ collectorMembershipId: z.string(), fullName: z.string(), effectiveness: z.number().nullable(), overdueAmount: z.int() });
export type CollectorPerformance = z.infer<typeof CollectorPerformanceSchema>;

/** Página de una lista larga de las estadísticas (`/lenders/me/stats/top-arrears`, `/collector-performance`, D-117). */
export const statsPageSchema = <T extends z.ZodType>(item: T) => z.object({ data: z.array(item), meta: z.object({ total: z.number() }) });

/** Respuesta de `QUERY /lenders/me/stats`: cartera en riesgo, mora por antigüedad y desempeño por cobrador, con el período anterior. */
export const LenderStatsSchema = z.object({
  from: z.string(),
  to: z.string(),
  totalPortfolio: z.int(),
  portfolioAtRisk: z.int(),
  arrearsRate: z.number().nullable(),
  arrearsByAge: z.array(z.object({ label: z.enum(['0-7', '8-15', '16-30', '30+']), amount: z.int(), clientsCount: z.int() })),
  /** Los 5 primeros; el resto, paginado, en `/lenders/me/stats/top-arrears`. */
  topArrears: z.array(TopArrearsEntrySchema),
  /** Los 5 primeros; el resto, paginado, en `/lenders/me/stats/collector-performance`. */
  collectorPerformance: z.array(CollectorPerformanceSchema),
  expectedAmount: z.int(),
  collectedAmount: z.int(),
  effectiveness: z.number().nullable(),
  previous: PrevSchema.nullable(),
});
export type LenderStats = z.infer<typeof LenderStatsSchema>;
