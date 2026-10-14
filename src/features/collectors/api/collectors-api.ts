import { z } from 'zod';
import { InvitedSchema, PortfolioSchema, ResetPasswordSchema, toInviteBody, type CollectorFormValues, type Invited, type Portfolio } from '@/features/collectors/lib/collector-schemas';
import { PeriodStatsSchema, type DateRange, type PeriodStats } from '@/features/stats/lib/stats-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import { ok, type Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** `POST /memberships`: invita a un cobrador. Si no tenía cuenta, devuelve su contraseña temporal (una sola vez). */
export function inviteCollector(values: CollectorFormValues): Response<Invited> {
  return authedRequest('/memberships', (body) => InvitedSchema.parse(body), { method: 'POST', body: toInviteBody(values) });
}

/** A quién pasa un préstamo activo del cobrador que se da de baja. */
export interface Reassignment {
  readonly loanId: string;
  readonly collectorMembershipId: string;
}

/**
 * `POST /collectors/:id/deactivate`: quita el acceso de inmediato, conserva el historial y, en la misma operación, pasa
 * cada préstamo activo del cobrador al indicado en `reassignments` (D-97). La API rechaza la baja de un cobrador por
 * `/memberships/:id/deactivate`.
 */
export function deactivateCollector(membershipId: string, reassignments: readonly Reassignment[]): Response<unknown> {
  return authedRequest(`/collectors/${membershipId}/deactivate`, (body) => body, { method: 'POST', body: { reassignments } });
}

/** Tope de páginas al leer los préstamos de un cobrador (50 × 50 = 2.500): evita un ciclo sin fin. */
const MAX_LOAN_PAGES = 50;
const LOAN_PAGE_SIZE = 50;
const LoanIdsPageSchema = z.object({ data: z.array(z.object({ id: z.string() })), meta: z.object({ total: z.number() }) });

/** `QUERY /loans { collectorMembershipId, status: ACTIVE }`: los préstamos activos que el cobrador tiene asignados hoy. */
export async function fetchCollectorActiveLoanIds(membershipId: string): Response<string[]> {
  const ids: string[] = [];
  for (let page = 1; page <= MAX_LOAN_PAGES; page += 1) {
    const result = await authedRequest('/loans', (body) => LoanIdsPageSchema.parse(body), {
      method: 'QUERY',
      body: { page, pageSize: LOAN_PAGE_SIZE, status: 'ACTIVE', collectorMembershipId: membershipId },
    });
    if (!result.ok) return result;
    ids.push(...result.value.data.map((loan) => loan.id));
    if (page * LOAN_PAGE_SIZE >= result.value.meta.total) break;
  }
  return ok(ids);
}

/** `POST /memberships/:id/reactivate`: le devuelve el acceso con su cartera; ocupa un cupo del plan. */
export function reactivateCollector(membershipId: string): Response<unknown> {
  return authedRequest(`/memberships/${membershipId}/reactivate`, (body) => body, { method: 'POST', body: {} });
}

/** `DELETE /memberships/:id`: borra a un cobrador registrado por error; con historial la API responde 409. */
export function deleteCollector(membershipId: string): Response<unknown> {
  return authedRequest(`/memberships/${membershipId}`, (body) => body, { method: 'DELETE' });
}

/** `POST /memberships/:id/reset-password`: genera una contraseña temporal nueva. */
export function resetCollectorPassword(membershipId: string): Response<string> {
  return authedRequest(`/memberships/${membershipId}/reset-password`, (body) => ResetPasswordSchema.parse(body).tempPassword, { method: 'POST', body: {} });
}

/** `PATCH /memberships/:id/roles`: cambia la cartera (el API exige reenviar los roles). */
export function changeCollectorPortfolio(membershipId: string, roles: readonly string[], portfolioId: string): Response<unknown> {
  return authedRequest(`/memberships/${membershipId}/roles`, (body) => body, { method: 'PATCH', body: { roles, portfolioId } });
}

/** `GET /portfolios`: todas las carteras del prestamista, sin paginar. */
export function fetchPortfolios(): Response<Portfolio[]> {
  return authedRequest('/portfolios', (body) => z.array(PortfolioSchema).parse(body));
}

/** `GET /collectors/:id/stats?from&to`: desempeño de un cobrador en un rango (solo Owner y Lender). */
export function fetchCollectorStats(membershipId: string, range: DateRange): Response<PeriodStats> {
  return authedRequest(`/collectors/${membershipId}/stats?from=${range.from}&to=${range.to}`, (body) => PeriodStatsSchema.parse(body));
}
