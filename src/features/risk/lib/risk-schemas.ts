import { z } from 'zod';

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** El riesgo de un cliente. Copia local de `ClientsRiskResponseSchema` del API (D-137). */
export const ClientRiskSchema = z.object({
  clientId: z.string(),
  score: z.number().int().min(0).max(100),
  level: z.enum(RISK_LEVELS),
  loansCount: z.number().int().nonnegative(),
  factors: z.array(
    z.object({
      code: z.enum(['OVERDUE_DAYS', 'OVERDUE_SHARE', 'MULTIPLE_LOANS_IN_ARREARS', 'PAID_LOANS']),
      points: z.number().int(),
      value: z.number().int().nonnegative(),
    }),
  ),
});
export type ClientRisk = z.infer<typeof ClientRiskSchema>;

export const ClientsRiskSchema = z.object({ data: z.array(ClientRiskSchema) });
