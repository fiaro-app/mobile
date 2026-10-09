import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { StatsView } from '@/components/organisms/StatsView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { STATS_COPY } from '@/features/stats/content/messages';
import { useStatsScreen } from '@/features/stats/hooks/use-stats-screen';
import type { Period } from '@/features/stats/lib/period-range';

/** Ruta `/stats`: cifras del cobrador por semana, mes o año, con comparativo y cartera vencida. */
export default function StatsScreen() {
  const router = useRouter();
  const screen = useStatsScreen();
  const model = screen.model;

  let body = <ClientDetailSkeleton />;
  if (screen.loadFailed) {
    body = (
      <EmptyState
        icon="alert-circle-outline"
        title={STATS_COPY.loadFailedTitle}
        message={STATS_COPY.loadFailedMessage}
        actionLabel="Reintentar"
        onAction={screen.refresh}
      />
    );
  } else if (model) {
    body = (
      <StatsView
        periods={STATS_COPY.periods}
        period={screen.period}
        onPeriod={(value) => {
          screen.setPeriod(value as Period);
        }}
        collected={{ label: STATS_COPY.collected, value: model.collected }}
        comparison={model.comparison.text}
        cards={[
          { label: STATS_COPY.expected, value: model.expected },
          { label: STATS_COPY.effectiveness, value: model.effectiveness },
          { label: STATS_COPY.visits, value: model.visits },
        ]}
        overdue={{ label: STATS_COPY.overdue, value: model.overdue, hint: STATS_COPY.overdueHint }}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
      />
    );
  }

  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={STATS_COPY.title}
          onBack={() => {
            router.back();
          }}
        />
      }
    >
      {body}
    </ScreenTemplate>
  );
}
