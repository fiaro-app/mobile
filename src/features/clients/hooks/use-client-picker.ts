import { useState } from 'react';
import { fetchClients } from '@/features/clients/api/clients-api';
import { useApiQuery } from '@/lib/hooks/use-api-query';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

/** Todo lo que el selector de cliente dibuja. */
export interface ClientPicker {
  readonly search: string;
  readonly setSearch: (text: string) => void;
  readonly options: readonly { value: string; label: string; description: string }[];
  readonly loading: boolean;
  readonly failed: boolean;
}

/**
 * Lógica del selector de cliente (para "Nuevo préstamo"): busca en el API por nombre o cédula con 350 ms de espera tras
 * la última letra y devuelve la primera página de resultados. Sin texto trae los primeros clientes. `enabled` evita pedir
 * mientras la hoja está cerrada.
 */
export function useClientPicker(enabled: boolean): ClientPicker {
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim());
  const query = useApiQuery(['admin', 'client-picker', term], () => fetchClients(1, term), enabled);
  return {
    search,
    setSearch,
    options: (query.data?.items ?? []).map((client) => ({ value: client.id, label: client.fullName, description: `CC ${client.nationalId}` })),
    loading: query.isPending && enabled,
    failed: query.isError && query.data === undefined,
  };
}
