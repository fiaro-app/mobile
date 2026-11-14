import { openRenewal, RENEW_LABEL } from '@/features/settings/lib/renew';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { DateRangeFields } from '@/components/molecules/DateRangeFields';
import { EmptyState } from '@/components/molecules/EmptyState';
import { DatePickerSheet } from '@/components/organisms/DatePickerSheet';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { DashboardView } from '@/components/organisms/DashboardView';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { DASHBOARD_COPY } from '@/features/dashboard/content/messages';
import { useCollectorsToday } from '@/features/collectors-today/hooks/use-collectors-today';
import { useDashboardScreen } from '@/features/dashboard/hooks/use-dashboard-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin`: "Resumen" del negocio, la pantalla de inicio del administrador. */
export default function AdminSummaryScreen() {
  const router = useRouter();
  const menu = useAdminMenu('summary');
  const screen = useDashboardScreen();
  const routes = useCollectorsToday();
  const model = screen.model;

  let body = <ClientDetailSkeleton />;
  if (screen.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title={DASHBOARD_COPY.loadFailedTitle} message={DASHBOARD_COPY.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />;
  } else if (model) {
    body = (
      <DashboardView
        kpis={model.kpis}
        banner={screen.banner ? { ...screen.banner, action: { label: RENEW_LABEL, onPress: openRenewal } } : null}
        alertsTitle={DASHBOARD_COPY.alerts}
        alerts={model.alerts}
        pendingTitle={DASHBOARD_COPY.pending}
        pendingEmpty={DASHBOARD_COPY.pendingEmpty}
        pending={model.pending.map((row) => ({ id: row.id, name: row.collectorName, detail: row.expected, amount: row.difference, tone: row.differenceTone, onPress: () => { router.push({ pathname: '/admin/settlements/[id]', params: { id: row.id } }); } }))}
        routes={routes.model ? { title: DASHBOARD_COPY.routes, summary: routes.model.summary, rows: routes.model.rows } : null}
        refreshing={screen.refreshing}
        onRefresh={() => {
          screen.refresh();
          routes.refresh();
        }}
        period={<DateRangeFields range={screen.dates.range} onOpen={screen.dates.open} onClear={screen.dates.clear} emptyHint={DASHBOARD_COPY.periodHint} />}
      />
    );
  }
  return (
    <AdminTemplate title={DASHBOARD_COPY.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      <View className="flex-1">
        {body}
        <DatePickerSheet
          visible={screen.dates.editing !== null}
          title={screen.dates.editing === 'to' ? 'Hasta' : 'Desde'}
          value={screen.dates.editingValue}
          today={screen.dates.today}
          max={screen.dates.today}
          onSelect={screen.dates.pick}
          onClose={screen.dates.close}
        />
      </View>
    </AdminTemplate>
  );
}
