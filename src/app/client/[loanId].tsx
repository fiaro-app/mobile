import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { ClientDetailView } from '@/components/organisms/ClientDetailView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { DETAIL_COPY } from '@/features/client-detail/content/messages';
import { useClientDetailScreen } from '@/features/client-detail/hooks/use-client-detail-screen';
import { AttachmentPanel } from '@/features/attachments/components/AttachmentPanel';
import { ATTACHMENT_COPY } from '@/features/attachments/content/messages';
import { SETTLEMENT_COPY } from '@/features/settlement/content/messages';
import { useDayPhase } from '@/features/settlement/hooks/use-settlement-data';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/client/[loanId]?clientId=...`: detalle de un cliente y su préstamo. */
export default function ClientDetailScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { loanId, clientId } = useLocalSearchParams<{ loanId: string; clientId: string }>();
  const screen = useClientDetailScreen(clientId, loanId);
  const model = screen.model;
  const dayPhase = useDayPhase();

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
        extra={
          <AttachmentPanel
            target="client"
            id={clientId}
            canEdit={false}
            title={ATTACHMENT_COPY.clientPhoto.title}
            description={ATTACHMENT_COPY.clientPhoto.description}
            alt={ATTACHMENT_COPY.clientPhoto.alt(model.name)}
            none={ATTACHMENT_COPY.clientPhoto.none}
          />
        }
        registerLabel={DETAIL_COPY.register}
        onRegister={
          model.canRegisterVisit
            ? () => {
                if (dayPhase !== 'open') {
                  Alert.alert(SETTLEMENT_COPY.dayClosedTitle, dayPhase === 'approved' ? SETTLEMENT_COPY.dayClosedApproved : SETTLEMENT_COPY.dayClosedInReview);
                  return;
                }
                router.push({ pathname: '/visit/[loanId]', params: { loanId, clientId } });
              }
            : undefined
        }
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
            goBack();
          }}
        />
      }
    >
      {body}
    </ScreenTemplate>
  );
}
