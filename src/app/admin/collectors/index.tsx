import { useRouter } from 'expo-router';
import { Fab } from '@/components/atoms/Fab';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ListHeader } from '@/components/molecules/ListHeader';
import { EntityList } from '@/components/organisms/EntityList';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { COLLECTORS_COPY } from '@/features/collectors/content/messages';
import { useCollectorsScreen } from '@/features/collectors/hooks/use-collectors-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/collectors`: listado de cobradores con búsqueda y filtro por estado. */
export default function CollectorsScreen() {
  const router = useRouter();
  const menu = useAdminMenu('collectors');
  const screen = useCollectorsScreen();
  const copy = COLLECTORS_COPY;

  let empty = null;
  if (screen.empty === 'no-collectors') {
    empty = <EmptyState icon="people-outline" title={copy.emptyTitle} message={copy.emptyMessage} actionLabel={copy.register} onAction={() => { router.push('/admin/collectors/new'); }} />;
  } else if (screen.empty === 'no-results') {
    empty = <EmptyState icon="search-outline" title={copy.noResultsTitle} message={copy.noResultsMessage} />;
  } else if (screen.empty === 'forbidden') {
    empty = <EmptyState icon="lock-closed-outline" title={copy.forbiddenTitle} message={copy.forbiddenMessage} />;
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
          subtitle: row.phone,
          detail: row.portfolio,
          badge: { label: row.active ? 'ACTIVO' : 'INACTIVO', kind: row.active ? 'good' : 'neutral' },
          onPress: () => {
            router.push({ pathname: '/admin/collectors/[id]', params: { id: row.id } });
          },
        }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        empty={empty}
        bottomSpace
        header={
          <ListHeader
            search={{ value: screen.search, placeholder: copy.searchPlaceholder, onChange: screen.setSearch }}
            filters={{ options: copy.statusOptions, value: screen.status, onChange: screen.setStatus }}
          />
        }
      />
      {screen.empty === 'forbidden' ? null : (
        <Fab
          label={copy.register}
          onPress={() => {
            router.push('/admin/collectors/new');
          }}
        />
      )}
    </AdminTemplate>
  );
}
