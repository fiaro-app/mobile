import { z } from 'zod';

const Money = z.number().int().nonnegative();
const Rate = z.number().nullable();

/**
 * Respuesta de `QUERY /lenders/me/stats/insights` (cómo va el negocio): cobro diario, ganancia, colocación, operación y
 * proyección de 7 días. Copia local de `LenderInsightsResponseSchema` del API.
 */
export const InsightsSchema = z.object({
  from: z.string(),
  to: z.string(),
  daily: z.array(z.object({ date: z.string(), expected: Money, collected: Money })),
  income: z.object({
    collected: Money,
    byMethod: z.object({ CASH: Money, NEQUI: Money, TRANSFER: Money }),
    interest: Money,
    principalRecovered: Money,
    interestShare: Rate,
  }),
  origination: z.object({ loansCreated: Money, amountLent: Money, averageTicket: Money.nullable(), agreedInterest: Money }),
  visits: z.object({ PAID: Money, NOT_FOUND: Money, REFUSED: Money, RESCHEDULED: Money, total: Money, contactRate: Rate, paidRate: Rate }),
  settlements: z.object({ submitted: Money, balanced: Money, withDifference: Money, shortfall: Money, surplus: Money }),
  forecast: z.array(z.object({ date: z.string(), expected: Money })),
  previous: z.object({ from: z.string(), to: z.string(), collected: Money, interest: Money, loansCreated: Money, amountLent: Money }),
});
export type Insights = z.infer<typeof InsightsSchema>;
