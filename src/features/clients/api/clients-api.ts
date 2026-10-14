import { ClientSchema, ClientsPageSchema, toClientBody, type Client, type ClientFormValues, type ClientListItem } from '@/features/clients/lib/client-schemas';
import { LoansPageSchema, type LoanListItem } from '@/features/loans/lib/loan-schemas';
import { authedRequest } from '@/lib/http/authed-request';
import type { ApiFailure } from '@/lib/http/failure';
import type { Result } from '@/lib/result';

type Response<T> = Promise<Result<T, ApiFailure>>;

/** Clientes por página: llena la pantalla y se pide la siguiente al llegar al final de la lista. */
export const CLIENTS_PAGE_SIZE = 10;

/** Una página de clientes con su total. */
export interface ClientsPage {
  readonly items: ClientListItem[];
  readonly total: number;
}

/** `QUERY /clients`: página de clientes con saldo y mora; `search` busca por nombre o cédula (en el API). */
export function fetchClients(page: number, search: string): Response<ClientsPage> {
  const term = search.trim();
  return authedRequest('/clients', (body) => {
    const parsed = ClientsPageSchema.parse(body);
    return { items: parsed.data, total: parsed.meta.total };
  }, { method: 'QUERY', body: { page, pageSize: CLIENTS_PAGE_SIZE, ...(term === '' ? {} : { search: term }) } });
}

/** `GET /clients/:id`. */
export function fetchClientById(id: string): Response<Client> {
  return authedRequest(`/clients/${id}`, (body) => ClientSchema.parse(body));
}

/** `POST /clients`: da de alta un cliente. */
export function createClient(values: ClientFormValues): Response<Client> {
  return authedRequest('/clients', (body) => ClientSchema.parse(body), { method: 'POST', body: toClientBody(values) });
}

/** `PATCH /clients/:id`: actualiza solo los campos enviados. */
export function updateClient(id: string, changes: Partial<ClientFormValues>): Response<Client> {
  return authedRequest(`/clients/${id}`, (body) => ClientSchema.parse(body), { method: 'PATCH', body: changes });
}

/** `QUERY /loans` de un cliente (los más recientes primero, hasta 20). */
export function fetchClientLoans(clientId: string): Response<LoanListItem[]> {
  return authedRequest('/loans', (body) => LoansPageSchema.parse(body).data, { method: 'QUERY', body: { page: 1, pageSize: 20, clientId } });
}
