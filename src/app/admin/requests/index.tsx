import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ListHeader } from '@/components/molecules/ListHeader';
import { EntityList } from '@/components/organisms/EntityList';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { REQUEST_COPY } from '@/features/loan-requests/content/messages';
import { useRequestsScreen } from '@/features/loan-requests/hooks/use-requests-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/requests`: solicitudes de préstamo de los cobradores (pendientes primero); tocar una abre su detalle. */
export default function RequestsAdminScreen() {
  const router = useRouter();
  const menu = useAdminMenu('requests');
  const screen = useRequestsScreen();
  const copy = REQUEST_COPY;
  const empty = screen.failed ? (
    <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />
  ) : (
    <EmptyState icon="paper-plane-outline" title={copy.emptyTitle} message={copy.emptyMessage} />
  );
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      <EntityList
        items={screen.rows.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          badge: row.badge,
          trailing: row.amount,
          onPress: () => {
            router.push({ pathname: '/admin/requests/[id]', params: { id: row.id } });
          },
        }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        onEndReached={screen.loadMore}
        loadingMore={screen.loadingMore}
        empty={empty}
        header={<ListHeader filters={{ options: copy.filters, value: screen.status, onChange: screen.setStatus }} />}
      />
    </AdminTemplate>
  );
}
