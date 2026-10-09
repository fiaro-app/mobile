import { z } from 'zod';

const AmountSchema = z.int().nonnegative();

/** Cobrado por medio de pago, en pesos enteros. */
export const ByMethodSchema = z.object({ CASH: AmountSchema, NEQUI: AmountSchema, TRANSFER: AmountSchema });
export type ByMethod = z.infer<typeof ByMethodSchema>;

/** Respuesta de `QUERY /collectors/me/daily-summary`: lo esperado y lo cobrado del día. */
export const DailySummarySchema = z.object({
  date: z.string(),
  expectedAmount: AmountSchema,
  collectedAmount: AmountSchema,
  collectedByMethod: ByMethodSchema,
});
export type DailySummary = z.infer<typeof DailySummarySchema>;

/** Estados de un cuadre: el prestamista lo aprueba o lo rechaza (y el cobrador puede reenviarlo). */
export const SettlementStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;

/** Cuadre diario tal como lo devuelve el API. */
export const SettlementSchema = z.object({
  id: z.string(),
  date: z.string(),
  expectedAmount: AmountSchema,
  collectedAmount: AmountSchema,
  collectedByMethod: ByMethodSchema,
  status: SettlementStatusSchema,
  collectorNote: z.string().nullable(),
  reviewNote: z.string().nullable(),
});
export type Settlement = z.infer<typeof SettlementSchema>;

/** Cuerpo de `POST /daily-settlements`. */
export interface SettlementRequest {
  readonly expectedAmount: number;
  readonly collectedCash: number;
  readonly collectedNequi: number;
  readonly collectedTransfer: number;
  readonly collectorNote: string | null;
}
