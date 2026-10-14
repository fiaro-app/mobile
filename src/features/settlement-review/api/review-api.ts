import { ReviewSettlementSchema, ReviewSettlementsPageSchema, type ReviewSettlement } from '@/features/settlement-review/lib/review-schemas';
import type { SettlementStatus } from '@/features/settlement/lib/settlement-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** Cuadres por página. */
export const SETTLEMENTS_PAGE_SIZE = 10;

/** Una página de cuadres con su total. */
export interface SettlementsPage {
  readonly items: ReviewSettlement[];
  readonly total: number;
}

/** `QUERY /daily-settlements`: cuadres del negocio, filtrados por estado en el API. */
export function fetchSettlements(page: number, status: SettlementStatus): Response<SettlementsPage> {
  return authedRequest(
    '/daily-settlements',
    (body) => {
      const parsed = ReviewSettlementsPageSchema.parse(body);
      return { items: parsed.data, total: parsed.meta.total };
    },
    { method: 'QUERY', body: { page, pageSize: SETTLEMENTS_PAGE_SIZE, status } },
  );
}

/** `GET /daily-settlements/:id`. */
export function fetchSettlementById(id: string): Response<ReviewSettlement> {
  return authedRequest(`/daily-settlements/${id}`, (body) => ReviewSettlementSchema.parse(body));
}

function reviewBody(note: string): { reviewNote?: string } {
  const trimmed = note.trim();
  return trimmed === '' ? {} : { reviewNote: trimmed };
}

/** `POST /daily-settlements/:id/approve`: aprueba un cuadre pendiente; el comentario es opcional. */
export function approveSettlement(id: string, note: string): Response<ReviewSettlement> {
  return authedRequest(`/daily-settlements/${id}/approve`, (body) => ReviewSettlementSchema.parse(body), { method: 'POST', body: reviewBody(note) });
}

/** `POST /daily-settlements/:id/reject`: rechaza un cuadre pendiente; el comentario es opcional pero útil (el cobrador lo lee). */
export function rejectSettlement(id: string, note: string): Response<ReviewSettlement> {
  return authedRequest(`/daily-settlements/${id}/reject`, (body) => ReviewSettlementSchema.parse(body), { method: 'POST', body: reviewBody(note) });
}
