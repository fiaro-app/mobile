import { CollectorsTodaySchema, type CollectorsToday } from '@/features/collectors-today/lib/collectors-today-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** `GET /lenders/me/collectors-today`: cómo va hoy la ruta de cada cobrador (solo OWNER/LENDER). */
export function fetchCollectorsToday(): Promise<Result<CollectorsToday, ApiFailure>> {
  return authedRequest('/lenders/me/collectors-today', (body) => CollectorsTodaySchema.parse(body));
}
