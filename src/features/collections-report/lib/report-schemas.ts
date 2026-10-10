import { z } from 'zod';

/** Una visita del reporte "Cobros del día" (todo el negocio). */
export const ReportEntrySchema = z.object({
  visitId: z.string(),
  occurredAt: z.string(),
  outcome: z.enum(['PAID', 'NOT_FOUND', 'REFUSED', 'RESCHEDULED']),
  expectedAmount: z.int(),
  promisedDate: z.string().nullable(),
  loan: z.object({ id: z.string() }),
  client: z.object({ id: z.string(), fullName: z.string() }),
  collector: z.object({ membershipId: z.string(), fullName: z.string() }),
  payment: z.object({ id: z.string(), amount: z.int(), method: z.enum(['CASH', 'NEQUI', 'TRANSFER']), reversed: z.boolean() }).nullable(),
});
export type ReportEntry = z.infer<typeof ReportEntrySchema>;

/** Página del reporte con el rango que el API resolvió (hoy si no se pidió uno). */
export const ReportPageSchema = z.object({ data: z.array(ReportEntrySchema), meta: z.object({ total: z.number() }), range: z.object({ from: z.string(), to: z.string() }) });
