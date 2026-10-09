import { BalanceSchema, ClientSchema, LoanSchema, VisitsSchema, type Balance, type Client, type Loan, type Visit } from '@/features/client-detail/lib/detail-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** `GET /clients/:id`: datos de contacto del cliente. */
export function fetchClient(clientId: string): Response<Client> {
  return authedRequest(`/clients/${clientId}`, (body) => ClientSchema.parse(body));
}

/** `GET /loans/:id`: condiciones del préstamo (cuota y frecuencia). */
export function fetchLoan(loanId: string): Response<Loan> {
  return authedRequest(`/loans/${loanId}`, (body) => LoanSchema.parse(body));
}

/** `GET /loans/:loanId/balance`: saldo, mora y próxima fecha, calculados por el motor de calendario del API. */
export function fetchBalance(loanId: string): Response<Balance> {
  return authedRequest(`/loans/${loanId}/balance`, (body) => BalanceSchema.parse(body));
}

/** `GET /loans/:loanId/collection-visits`: historial de visitas con su pago, sin paginar. */
export function fetchVisits(loanId: string): Response<Visit[]> {
  return authedRequest(`/loans/${loanId}/collection-visits`, (body) => VisitsSchema.parse(body));
}
