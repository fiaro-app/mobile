import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ListHeader } from '@/components/molecules/ListHeader';
import { EntityList } from '@/components/organisms/EntityList';
import { PeriodCollectorFilters } from '@/components/molecules/PeriodCollectorFilters';
import { PeriodCollectorSheets } from '@/components/organisms/PeriodCollectorSheets';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { useReportScreen } from '@/features/collections-report/hooks/use-report-screen';
import { REPORT_COPY } from '@/features/collections-report/content/messages';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/payments`: "Cobros del día", las visitas de todo el negocio (hoy o un rango de fechas); tocar una abre su préstamo. */
export default function PaymentsScreen() {
  const router = useRouter();
  const menu = useAdminMenu('payments');
  const screen = useReportScreen();
  const copy = REPORT_COPY;
  const empty = screen.failed ? (
    <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />
  ) : (
    <EmptyState icon="receipt-outline" title={copy.emptyTitle} message={copy.emptyMessage} />
  );
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      <EntityList
        items={screen.rows.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          detail: row.detail,
          badge: row.badge ?? undefined,
          trailing: row.trailing === '' ? undefined : row.trailing,
          onPress: () => {
            router.push({ pathname: '/admin/loans/[id]', params: { id: row.loanId } });
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
            <ListHeader filters={{ options: copy.filters, value: screen.filter, onChange: screen.setFilter }} />
            <PeriodCollectorFilters
              dates={screen.dates}
              periodHint={copy.periodHint}
              collectorLabel={screen.collector.label}
              collectorActive={screen.collector.applied !== null}
              onOpenCollector={screen.collector.openSheet}
            />
            <AppText variant="caption" tone="muted" className="bg-surface px-5 pb-4">
              {screen.summary}
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
