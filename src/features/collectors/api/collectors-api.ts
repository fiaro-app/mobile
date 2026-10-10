import { z } from 'zod';
import { InvitedSchema, PortfolioSchema, ResetPasswordSchema, toInviteBody, type CollectorFormValues, type Invited, type Portfolio } from '@/features/collectors/lib/collector-schemas';
import { PeriodStatsSchema, type DateRange, type PeriodStats } from '@/features/stats/lib/stats-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** `POST /memberships`: invita a un cobrador. Si no tenía cuenta, devuelve su contraseña temporal (una sola vez). */
export function inviteCollector(values: CollectorFormValues): Response<Invited> {
  return authedRequest('/memberships', (body) => InvitedSchema.parse(body), { method: 'POST', body: toInviteBody(values) });
}

/** `POST /memberships/:id/deactivate`: quita el acceso de inmediato y conserva el historial. */
export function deactivateCollector(membershipId: string): Response<unknown> {
  return authedRequest(`/memberships/${membershipId}/deactivate`, (body) => body, { method: 'POST', body: {} });
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
