import { useMemo } from 'react';
import { emptyContentFor, type EmptyContent } from '@/features/route/content/empty-content';
import { useRoute } from '@/features/route/hooks/use-route';
import { toRowViewModel, type RowViewModel } from '@/features/route/lib/row-view-model';
import { initials } from '@/features/auth/lib/names';
import { useSessionStore } from '@/features/auth/store/session-store';

/** Todo lo que la pantalla "Ruta de hoy" dibuja. */
export interface RouteScreen {
  readonly rows: RowViewModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly refresh: () => void;
  readonly empty: EmptyContent;
  readonly userInitials: string;
}

/** Une la ruta cargada con la persona de la sesión y la deja lista para dibujar. */
export function useRouteScreen(): RouteScreen {
  const route = useRoute();
  const user = useSessionStore((state) => state.user);
  const rows = useMemo(() => route.entries.map(toRowViewModel), [route.entries]);
  return {
    rows,
    loading: route.state === 'loading',
    refreshing: route.refreshing,
    refresh: route.refresh,
    empty: emptyContentFor(route.state, false),
    userInitials: initials(user?.fullName ?? ''),
  };
}
