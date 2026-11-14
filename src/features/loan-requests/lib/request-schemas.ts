import { z } from 'zod';
import { FrequencySchema } from '@/features/loans/lib/loan-schemas';

/** Estados de una solicitud de préstamo. */
export const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const RequestStatusSchema = z.enum(REQUEST_STATUSES);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

/** Solicitud de préstamo de un cobrador (D-138 de la API). */
export const LoanRequestSchema = z.object({
  id: z.string(),
  status: RequestStatusSchema,
  requestedByMembershipId: z.string(),
  clientId: z.string().nullable(),
  nationalId: z.string(),
  newClient: z.object({ fullName: z.string(), occupation: z.string(), phone: z.string(), address: z.string() }).nullable(),
  principalAmount: z.int(),
  installmentCount: z.int(),
  installmentValue: z.int(),
  totalPayable: z.int(),
  frequency: FrequencySchema,
  startDate: z.string(),
  resolvedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  loanId: z.string().nullable(),
  createdAt: z.string(),
});
export type LoanRequest = z.infer<typeof LoanRequestSchema>;

/** Página de solicitudes. */
export const LoanRequestsPageSchema = z.object({ data: z.array(LoanRequestSchema), meta: z.object({ total: z.number() }) });

/** Respuesta de la consulta de una cédula: solo si existe, nunca datos del cliente. */
export const ClientLookupSchema = z.object({ exists: z.boolean() });
