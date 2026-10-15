import { EmptyState } from '@/components/molecules/EmptyState';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { DatePickerSheet } from '@/components/organisms/DatePickerSheet';
import { LenderStatsView } from '@/components/organisms/LenderStatsView';
import { OptionSheet } from '@/components/organisms/OptionSheet';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { LENDER_STATS_COPY } from '@/features/lender-stats/content/messages';
import { useInsights } from '@/features/insights/hooks/use-insights';
import { useLenderStatsScreen } from '@/features/lender-stats/hooks/use-lender-stats-screen';
import { STATS_COPY } from '@/features/stats/content/messages';
import type { Period } from '@/features/stats/lib/period-range';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';

/** Ruta `/admin/stats`: estadísticas del negocio por semana, mes, año o un rango de fechas, con tendencias y filtros por cobrador y cartera. */
export default function AdminStatsScreen() {
  const menu = useAdminMenu('stats');
  const screen = useLenderStatsScreen();
  const insights = useInsights(screen.range);
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
        dates={{ range: screen.dates.range, onOpen: screen.dates.open, onClear: screen.dates.clear, hint: copy.periodHint }}
        collector={{ label: screen.collectorLabel, active: screen.collectorId !== '', onOpen: screen.openSheet }}
        portfolio={{ label: screen.portfolio.label, active: screen.portfolio.id !== '', onOpen: screen.portfolio.openSheet }}
        periodLabel={model.period}
        kpis={model.kpis}
        bucketsTitle={copy.buckets}
        buckets={model.buckets}
        topTitle={copy.top}
        top={screen.topArrears.rows}
        topMore={screen.topArrears.more}
        collectorsTitle={copy.collectors}
        collectors={screen.collectors.rows}
        collectorsMore={screen.collectors.more}
        empty={model.isEmpty ? copy.empty : null}
        exportPdf={{ label: copy.exportPdf, busy: screen.pdf.busy, error: screen.pdf.error, onPress: screen.pdf.start }}
        insights={insights.model}
        refreshing={screen.refreshing}
        onRefresh={() => {
          screen.refresh();
          insights.refresh();
        }}
        sheets={
          <>
            <OptionSheet visible={screen.sheetOpen} title={copy.collectorSheet} options={screen.collectorOptions} selected={screen.collectorId} onSelect={screen.setCollector} onClose={screen.closeSheet} />
            <OptionSheet visible={screen.portfolio.open} title={copy.portfolioSheet} options={screen.portfolio.options} selected={screen.portfolio.id} onSelect={screen.portfolio.select} onClose={screen.portfolio.closeSheet} />
            <DatePickerSheet
              visible={screen.dates.editing !== null}
              title={screen.dates.editing === 'to' ? 'Hasta' : 'Desde'}
              value={screen.dates.editingValue}
              today={screen.dates.today}
              max={screen.dates.today}
              onSelect={screen.dates.pick}
              onClose={screen.dates.close}
            />
          </>
        }
      />
    );
  }
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      {body}
    </AdminTemplate>
  );
}
