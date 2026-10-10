import { EmptyState } from '@/components/molecules/EmptyState';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { DashboardView } from '@/components/organisms/DashboardView';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { DASHBOARD_COPY } from '@/features/dashboard/content/messages';
import { useDashboardScreen } from '@/features/dashboard/hooks/use-dashboard-screen';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin`: "Resumen" del negocio, la pantalla de inicio del administrador. */
export default function AdminSummaryScreen() {
  const menu = useAdminMenu('summary');
  const screen = useDashboardScreen();
  const model = screen.model;

  let body = <ClientDetailSkeleton />;
  if (screen.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title={DASHBOARD_COPY.loadFailedTitle} message={DASHBOARD_COPY.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />;
  } else if (model) {
    body = (
      <DashboardView
        kpis={model.kpis}
        alertsTitle={DASHBOARD_COPY.alerts}
        alerts={model.alerts}
        pendingTitle={DASHBOARD_COPY.pending}
        pendingEmpty={DASHBOARD_COPY.pendingEmpty}
        pending={model.pending.map((row) => ({ id: row.id, name: row.collectorName, detail: row.expected, amount: row.difference, tone: row.differenceTone }))}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
      />
    );
  }
  return (
    <AdminTemplate title={DASHBOARD_COPY.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      {body}
    </AdminTemplate>
  );
}
