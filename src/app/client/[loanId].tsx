import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { ClientDetailView } from '@/components/organisms/ClientDetailView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { DETAIL_COPY } from '@/features/client-detail/content/messages';
import { useClientDetailScreen } from '@/features/client-detail/hooks/use-client-detail-screen';

/** Ruta `/client/[loanId]?clientId=...`: detalle de un cliente y su préstamo. */
export default function ClientDetailScreen() {
  const router = useRouter();
  const { loanId, clientId } = useLocalSearchParams<{ loanId: string; clientId: string }>();
  const screen = useClientDetailScreen(clientId, loanId);
  const model = screen.model;

  let body = <ClientDetailSkeleton />;
  if (model) {
    body = (
      <ClientDetailView
        name={model.name}
        initials={model.initials}
        status={model.status}
        rows={screen.rows}
        history={model.history}
        historyTitle={DETAIL_COPY.historyTitle}
        historyEmpty={DETAIL_COPY.historyEmpty}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        callLabel={DETAIL_COPY.call}
        onCall={screen.call}
        registerLabel={DETAIL_COPY.register}
      />
    );
  } else if (screen.state !== 'loading') {
    body = <EmptyState {...screen.empty} actionLabel="Reintentar" onAction={screen.refresh} />;
  }

  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={screen.title}
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
