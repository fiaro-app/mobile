import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { View } from 'react-native';
import { ListHeader } from '@/components/molecules/ListHeader';
import { PeriodCollectorFilters } from '@/components/molecules/PeriodCollectorFilters';
import { PeriodCollectorSheets } from '@/components/organisms/PeriodCollectorSheets';
import { EntityList } from '@/components/organisms/EntityList';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { REVIEW_COPY } from '@/features/settlement-review/content/messages';
import { useReviewScreen } from '@/features/settlement-review/hooks/use-review-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/settlements`: cuadres por estado (pendientes primero), fechas y cobrador; tocar uno abre su revisión. */
export default function SettlementsAdminScreen() {
  const router = useRouter();
  const menu = useAdminMenu('settlements');
  const screen = useReviewScreen();
  const copy = REVIEW_COPY;
  const empty = screen.failed ? (
    <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />
  ) : (
    <EmptyState icon="wallet-outline" title={copy.emptyTitle} message={copy.emptyMessage} />
  );
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      <EntityList
        items={screen.rows.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          badge: row.badge,
          trailing: row.difference,
          onPress: () => {
            router.push({ pathname: '/admin/settlements/[id]', params: { id: row.id } });
          },
        }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        onEndReached={screen.loadMore}
        loadingMore={screen.loadingMore}
        empty={empty}
        header={
          <View>
            <ListHeader filters={{ options: copy.filters, value: screen.status, onChange: screen.setStatus }} />
            <PeriodCollectorFilters
              dates={screen.dates}
              periodHint={copy.periodHint}
              collectorLabel={screen.collector.label}
              collectorActive={screen.collector.applied !== null}
              onOpenCollector={screen.collector.openSheet}
            />
          </View>
        }
      />
      <PeriodCollectorSheets
        dates={screen.dates}
        collector={{ open: screen.collector.open, options: screen.collector.options, selected: screen.collector.id, onSelect: screen.collector.select, onClose: screen.collector.closeSheet }}
      />
    </AdminTemplate>
  );
}
