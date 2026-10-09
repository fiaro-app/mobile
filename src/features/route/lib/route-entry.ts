import { z } from 'zod';

/**
 * Una fila de la ruta del día: un préstamo con su cliente y su estado financiero. Copia local de
 * `CollectorRouteEntryResponseSchema` del API (`QUERY /collectors/me/route`); cuando se instale
 * `@fiaro-app/contracts` (M-11) se reemplazará por el schema compartido.
 */
export const RouteEntrySchema = z.object({
  loanId: z.string(),
  clientId: z.string(),
  clientFullName: z.string(),
  /** Saldo pendiente, en pesos. */
  balance: z.number().int(),
  /** Cuánto de lo esperado hasta hoy sigue sin pagar, en pesos. */
  overdueAmount: z.number().int(),
  /** Días desde la cuota impaga más antigua (0 si está al día). */
  overdueDays: z.number().int(),
  nextDueDate: z.string().nullable(),
});
export type RouteEntry = z.infer<typeof RouteEntrySchema>;

/** Respuesta completa de la ruta: sin paginar. */
export const RouteSchema = z.array(RouteEntrySchema);
