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

/** `POST /lender/logo-upload-url`: URL firmada para subir el logo directo al almacenamiento (solo Owner y Lender). */
export function requestLogoUploadUrl(contentType: 'image/png' | 'image/jpeg'): Response<{ uploadUrl: string; publicUrl: string }> {
  return authedRequest('/lender/logo-upload-url', (body) => z.object({ uploadUrl: z.string(), publicUrl: z.string() }).parse(body), { method: 'POST', body: { contentType } });
}

/**
 * Sube la imagen a la URL firmada (`PUT` directo al almacenamiento, SIN la sesión de Fiaro: la firma ya autoriza). Devuelve `true` si el
 * almacenamiento respondió bien; un fallo de red o de permiso del almacenamiento no es un error del API y se informa aparte.
 */
export async function uploadToStorage(uploadUrl: string, imageUri: string, contentType: string): Promise<boolean> {
  try {
    const blob = await (await fetch(imageUri)).blob();
    const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': contentType }, body: blob });
    return response.ok;
  } catch {
    return false;
  }
}

/** `GET /subscription`: el plan del negocio (cualquier rol con membresía activa). */
export function fetchSubscription(): Response<Subscription> {
  return authedRequest('/subscription', (body) => SubscriptionSchema.parse(body));
}
