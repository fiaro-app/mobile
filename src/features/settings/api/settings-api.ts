import { z } from 'zod';
import { LenderSettingsSchema, PortfolioSchema, SubscriptionSchema, type LenderPatch, type LenderSettings, type Portfolio, type Subscription } from '@/features/settings/lib/settings-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** `GET /lender`: nombre, color de marca y días sin cobro del negocio. */
export function fetchLenderSettings(): Response<LenderSettings> {
  return authedRequest('/lender', (body) => LenderSettingsSchema.parse(body));
}

/** `PATCH /lender`: actualiza solo los campos enviados (solo Owner y Lender). */
export function patchLender(patch: LenderPatch): Response<LenderSettings> {
  return authedRequest('/lender', (body) => LenderSettingsSchema.parse(body), { method: 'PATCH', body: patch });
}

/** `GET /portfolios`: todas las carteras, sin paginar. */
export function fetchPortfolioList(): Response<Portfolio[]> {
  return authedRequest('/portfolios', (body) => z.array(PortfolioSchema).parse(body));
}

/** `POST /portfolios`: crea una cartera (el nombre no puede repetirse). */
export function createPortfolio(name: string): Response<Portfolio> {
  return authedRequest('/portfolios', (body) => PortfolioSchema.parse(body), { method: 'POST', body: { name } });
}

/** `PATCH /portfolios/:id`: renombra una cartera, la de por defecto incluida. */
export function renamePortfolio(id: string, name: string): Response<Portfolio> {
  return authedRequest(`/portfolios/${id}`, (body) => PortfolioSchema.parse(body), { method: 'PATCH', body: { name } });
}

/** `DELETE /portfolios/:id`: borra una cartera (409 si es la de por defecto o tiene cobradores activos). */
export function deletePortfolio(id: string): Response<unknown> {
  return authedRequest(`/portfolios/${id}`, (body) => body, { method: 'DELETE' });
}

/** `GET /subscription`: el plan del negocio (cualquier rol con membresía activa). */
export function fetchSubscription(): Response<Subscription> {
  return authedRequest('/subscription', (body) => SubscriptionSchema.parse(body));
}
