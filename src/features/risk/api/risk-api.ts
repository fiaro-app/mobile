import { ClientsRiskSchema, type ClientRisk } from '@/features/risk/lib/risk-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import { ok, type Result } from '@/lib/result';

/** `QUERY /lenders/me/clients/risk`: el riesgo de hasta 50 clientes del negocio (solo Owner y Lender). */
export async function fetchClientsRisk(clientIds: readonly string[]): Promise<Result<ClientRisk[], ApiFailure>> {
  const result = await authedRequest('/lenders/me/clients/risk', (body) => ClientsRiskSchema.parse(body), { method: 'QUERY', body: { clientIds } });
  return result.ok ? ok(result.value.data) : result;
}
