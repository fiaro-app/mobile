import { ClientLookupSchema, LoanRequestSchema, LoanRequestsPageSchema, type LoanRequest, type RequestStatus } from '@/features/loan-requests/lib/request-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** Solicitudes por página. */
export const REQUESTS_PAGE_SIZE = 10;

/** Una página de solicitudes con su total. */
export interface RequestsPage {
  readonly items: LoanRequest[];
  readonly total: number;
}

/** Cuerpo de `POST /loan-requests`. */
export interface CreateLoanRequestBody {
  readonly nationalId: string;
  readonly client?: { readonly fullName: string; readonly occupation: string; readonly phone: string; readonly address: string };
  readonly principalAmount: number;
  readonly installmentCount: number;
  readonly installmentValue: number;
  readonly totalPayable: number;
  readonly frequency: string;
  readonly startDate: string;
}

/** `POST /loan-requests/client-lookup`: ¿la cédula ya es de un cliente del negocio? Solo responde sí o no. */
export function lookupClient(nationalId: string): Response<boolean> {
  return authedRequest('/loan-requests/client-lookup', (body) => ClientLookupSchema.parse(body).exists, { method: 'POST', body: { nationalId } });
}

/** `POST /loan-requests`: el cobrador sugiere un préstamo al administrador. */
export function createLoanRequest(body: CreateLoanRequestBody): Response<LoanRequest> {
  return authedRequest('/loan-requests', (response) => LoanRequestSchema.parse(response), { method: 'POST', body });
}

/** `QUERY /loan-requests`: las solicitudes del negocio (las de todos para el administrador); `status` filtra en el API. */
export function fetchLoanRequests(page: number, status: RequestStatus | null): Response<RequestsPage> {
  return authedRequest(
    '/loan-requests',
    (body) => {
      const parsed = LoanRequestsPageSchema.parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    { method: 'QUERY', body: { page, pageSize: REQUESTS_PAGE_SIZE, ...(status ? { status } : {}) } },
  );
}

/** `GET /loan-requests/:id`. */
export function fetchLoanRequestById(id: string): Response<LoanRequest> {
  return authedRequest(`/loan-requests/${id}`, (body) => LoanRequestSchema.parse(body));
}

/** `POST /loan-requests/:id/approve`: crea el cliente (si es nuevo), el préstamo y su asignación al cobrador. */
export function approveLoanRequest(id: string): Response<LoanRequest> {
  return authedRequest(`/loan-requests/${id}/approve`, (body) => LoanRequestSchema.parse(body), { method: 'POST', body: {} });
}

/** `POST /loan-requests/:id/reject`: la descarta; el motivo es opcional pero el cobrador lo lee. */
export function rejectLoanRequest(id: string, reason: string): Response<LoanRequest> {
  const trimmed = reason.trim();
  return authedRequest(`/loan-requests/${id}/reject`, (body) => LoanRequestSchema.parse(body), { method: 'POST', body: trimmed === '' ? {} : { reason: trimmed } });
}
