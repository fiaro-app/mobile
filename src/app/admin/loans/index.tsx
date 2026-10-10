import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ListHeader } from '@/components/molecules/ListHeader';
import { EntityList } from '@/components/organisms/EntityList';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { LOANS_COPY } from '@/features/loans/content/messages';
import { useLoansScreen } from '@/features/loans/hooks/use-loans-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/loans`: préstamos con filtro por estado, búsqueda por cliente y carga por páginas. */
export default function LoansScreen() {
  const router = useRouter();
  const menu = useAdminMenu('loans');
  const screen = useLoansScreen();
  const copy = LOANS_COPY;

  let empty = null;
  if (screen.empty === 'no-loans') {
    empty = <EmptyState icon="cash-outline" title={copy.emptyTitle} message={copy.emptyMessage} />;
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
          title: row.title,
          subtitle: row.subtitle,
          detail: row.detail === '' ? undefined : row.detail,
          badge: row.badge,
          onPress: () => {
            router.push({ pathname: '/admin/loans/[id]', params: { id: row.id } });
          },
        }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        onEndReached={screen.loadMore}
        loadingMore={screen.loadingMore}
        empty={empty}
        header={
          <ListHeader
            search={{ value: screen.search, placeholder: copy.searchPlaceholder, onChange: screen.setSearch }}
            filters={{ options: copy.filters, value: screen.filter, onChange: screen.setFilter }}
          />
        }
      />
    </AdminTemplate>
  );
}
