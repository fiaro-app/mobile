import { ImportResponseSchema, type ImportResponse, type ImportRow } from '@/features/imports/lib/import-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

/** `POST /imports`: una tanda (hasta 200 filas). Con `dryRun` solo revisa, sin él crea clientes y préstamos. */
export function runImport(rows: readonly ImportRow[], dryRun: boolean): Promise<Result<ImportResponse, ApiFailure>> {
  return authedRequest('/imports', (body) => ImportResponseSchema.parse(body), { method: 'POST', body: { dryRun, rows } });
}
