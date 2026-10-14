import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import type { StatsListPage } from '@/features/lender-stats/api/lender-stats-api';
import type { ApiFailure } from '@/lib/http/failure';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import type { Result } from '@/lib/result';

/** Cuántas filas traen de entrada las estadísticas: si llegan todas, puede haber más. */
export const INITIAL_LIST_SIZE = 5;

/** Una lista larga de las estadísticas: sus primeras filas, o todas las páginas cargadas al expandirla. */
export interface StatsList<Row> {
  readonly rows: readonly Row[];
  /** Botón bajo la lista: «Ver todos» para expandir, «Ver más» para la página siguiente, o nada. */
  readonly more: { readonly label: string; readonly busy: boolean; readonly onPress: () => void } | null;
}

/**
 * Lógica de una lista larga de las estadísticas (mayor mora, desempeño, D-117): muestra las primeras filas que trajo
 * `QUERY /lenders/me/stats` y, al pedir «Ver todos», la reemplaza por la lista completa, que crece por páginas.
 *
 * @param key - Clave de caché de la lista, con sus filtros.
 * @param initial - Las filas que trajeron las estadísticas.
 * @param fetchPage - Lee una página de la lista completa.
 * @param toRow - Convierte una fila del API en la de la pantalla.
 */
export function useStatsList<Item, Row>(
  key: readonly unknown[],
  initial: readonly Row[],
  fetchPage: (page: number) => Promise<Result<StatsListPage<Item>, ApiFailure>>,
  toRow: (item: Item) => Row,
): StatsList<Row> {
  const [expanded, setExpanded] = useState(false);
  const query = useInfiniteQuery<StatsListPage<Item>, Error, { pages: StatsListPage<Item>[] }, readonly unknown[], number>({
    queryKey: ['admin', 'stats-list', ...key],
    enabled: expanded,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchPage(pageParam);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
  });
  if (!expanded || query.data === undefined) {
    return {
      rows: initial,
      more: initial.length >= INITIAL_LIST_SIZE ? { label: 'Ver todos', busy: expanded, onPress: () => { setExpanded(true); } } : null,
    };
  }
  return {
    rows: query.data.pages.flatMap((page) => page.items.map(toRow)),
    more: query.hasNextPage
      ? {
          label: 'Ver más',
          busy: query.isFetchingNextPage,
          onPress: () => {
            if (!query.isFetchingNextPage) void query.fetchNextPage();
          },
        }
      : null,
  };
}
