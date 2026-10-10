import { EmptyState } from '@/components/molecules/EmptyState';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { LenderStatsView } from '@/components/organisms/LenderStatsView';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { LENDER_STATS_COPY } from '@/features/lender-stats/content/messages';
import { useLenderStatsScreen } from '@/features/lender-stats/hooks/use-lender-stats-screen';
import { STATS_COPY } from '@/features/stats/content/messages';
import type { Period } from '@/features/stats/lib/period-range';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/stats`: estadísticas del negocio por semana, mes o año, con tendencias y filtro por cobrador. */
export default function AdminStatsScreen() {
  const menu = useAdminMenu('stats');
  const screen = useLenderStatsScreen();
  const copy = LENDER_STATS_COPY;
  const model = screen.model;

  let body = <ClientDetailSkeleton />;
  if (screen.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />;
  } else if (model) {
    body = (
      <LenderStatsView
        periods={STATS_COPY.periods}
        period={screen.period}
        onPeriod={(value) => {
          screen.setPeriod(value as Period);
        }}
        collector={{ label: screen.collectorLabel, onOpen: screen.openSheet }}
        periodLabel={model.period}
        kpis={model.kpis}
        bucketsTitle={copy.buckets}
        buckets={model.buckets}
        topTitle={copy.top}
        top={model.topArrears}
        collectorsTitle={copy.collectors}
        collectors={model.collectors}
        empty={model.isEmpty ? copy.empty : null}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        sheet={{ visible: screen.sheetOpen, title: copy.collectorSheet, options: screen.collectorOptions, selected: screen.collectorId, onSelect: screen.setCollector, onClose: screen.closeSheet }}
      />
    );
  }
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      {body}
    </AdminTemplate>
  );
}
