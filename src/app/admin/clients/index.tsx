import { useRouter } from 'expo-router';
import { Fab } from '@/components/atoms/Fab';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ListHeader } from '@/components/molecules/ListHeader';
import { EntityList } from '@/components/organisms/EntityList';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { CLIENTS_COPY } from '@/features/clients/content/messages';
import { useClientsScreen } from '@/features/clients/hooks/use-clients-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/clients`: clientes con búsqueda (en el API), filtro por situación de pago y carga por páginas. */
export default function ClientsAdminScreen() {
  const router = useRouter();
  const menu = useAdminMenu('clients');
  const screen = useClientsScreen();
  const copy = CLIENTS_COPY;

  let empty = null;
  if (screen.empty === 'no-clients') {
    empty = <EmptyState icon="people-outline" title={copy.emptyTitle} message={copy.emptyMessage} actionLabel={copy.register} onAction={() => { router.push('/admin/clients/new'); }} />;
  } else if (screen.empty === 'no-results') {
    empty = <EmptyState icon="search-outline" title={copy.noResultsTitle} message={copy.noResultsMessage} />;
  } else if (screen.empty === 'error') {
    empty = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />;
  }

  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      <EntityList
        items={screen.rows.map((row) => ({
          id: row.id,
          initials: row.initials,
          title: row.name,
          subtitle: row.subtitle,
          detail: row.detail,
          badge: row.badge,
          trailing: row.trailing === '' ? undefined : row.trailing,
          onPress: () => {
            router.push({ pathname: '/admin/clients/[id]', params: { id: row.id } });
          },
        }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        onEndReached={screen.loadMore}
        loadingMore={screen.loadingMore}
        empty={empty}
        bottomSpace
        header={
          <ListHeader
            search={{ value: screen.search, placeholder: copy.searchPlaceholder, onChange: screen.setSearch }}
            filters={{ options: copy.filters, value: screen.filter, onChange: screen.setFilter }}
          />
        }
      />
      <Fab
        label={copy.register}
        onPress={() => {
          router.push('/admin/clients/new');
        }}
      />
    </AdminTemplate>
  );
}
