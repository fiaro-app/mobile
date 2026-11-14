import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PeriodCollectorFilters } from '@/components/molecules/PeriodCollectorFilters';
import { EntityList } from '@/components/organisms/EntityList';
import { PeriodCollectorSheets } from '@/components/organisms/PeriodCollectorSheets';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { ROUTES_COPY } from '@/features/routes/content/messages';
import { useRoutesScreen } from '@/features/routes/hooks/use-routes-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/routes`: el registro de rutas, un renglón por cobrador y día con cuándo empezó y terminó, visitas y lo cobrado. */
export default function RoutesScreen() {
  const menu = useAdminMenu('routes');
  const screen = useRoutesScreen();
  const copy = ROUTES_COPY;
  const empty = screen.failed ? (
    <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />
  ) : (
    <EmptyState icon="map-outline" title={copy.emptyTitle} message={copy.emptyMessage} />
  );
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      <EntityList
        items={screen.rows.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, detail: row.detail, trailing: row.trailing }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        onEndReached={screen.loadMore}
        loadingMore={screen.loadingMore}
        empty={empty}
        header={
          <View>
            <PeriodCollectorFilters
              dates={screen.dates}
              periodHint={copy.periodHint}
              collectorLabel={screen.collector.label}
              collectorActive={screen.collector.applied !== null}
              onOpenCollector={screen.collector.openSheet}
            />
            <AppText variant="caption" tone="muted" className="bg-surface px-5 pb-4">
              {copy.detailHint}
            </AppText>
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
