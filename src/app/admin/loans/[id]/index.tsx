import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { LoanDetailView } from '@/components/organisms/LoanDetailView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { LOANS_COPY } from '@/features/loans/content/messages';
import { useLoanDetail } from '@/features/loans/hooks/use-loan-detail';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/loans/[id]`: detalle de un préstamo con saldo, cobrador y accesos a calendario, historial y ficha. */
export default function LoanDetailScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useLoanDetail(id);
  const copy = LOANS_COPY.detail;

  let body = <ClientDetailSkeleton />;
  if (detail.notFound) {
    body = <EmptyState icon="document-outline" title={copy.notFoundTitle} message={copy.notFoundMessage} />;
  } else if (detail.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={LOANS_COPY.loadFailedMessage} actionLabel="Reintentar" onAction={detail.refresh} />;
  } else if (detail.model) {
    const model = detail.model;
    body = (
      <LoanDetailView
        clientName={model.clientName}
        badge={model.badge}
        balanceLabel={copy.balance}
        balance={model.balance}
        percent={model.percent}
        progress={model.progress}
        rows={model.rows}
        collectorLabel={copy.collector}
        collectorValue={model.collectorName ?? copy.noCollector}
        assignLabel={copy.assign}
        onAssign={() => {
          detail.openDialog('assign');
        }}
        links={[
          { key: 'calendar', icon: 'calendar-outline', label: copy.calendar, onPress: () => { router.push({ pathname: '/admin/loans/[id]/calendar', params: { id } }); } },
          { key: 'history', icon: 'receipt-outline', label: copy.history, onPress: () => { router.push({ pathname: '/admin/loans/[id]/history', params: { id } }); } },
          { key: 'client', icon: 'person-outline', label: copy.client, onPress: () => { router.push({ pathname: '/admin/clients/[id]', params: { id: model.clientId } }); } },
        ]}
        error={detail.error}
        notice={detail.notice}
        cancel={
          model.canCancel
            ? {
                note: copy.cancelNote,
                label: copy.cancel,
                onPress: () => {
                  detail.openDialog('cancel');
                },
              }
            : null
        }
        busy={detail.busy}
        dialog={{
          visible: detail.dialog === 'cancel',
          title: copy.cancelTitle,
          message: model.cancelMessage,
          cancelLabel: copy.dismiss,
          confirmLabel: copy.cancelConfirm,
          onCancel: detail.closeDialog,
          onConfirm: detail.confirmCancel,
          destructive: true,
        }}
        assignSheet={{ visible: detail.dialog === 'assign', title: copy.assignTitle, options: detail.collectorOptions, onSelect: detail.assign, onClose: detail.closeDialog }}
      />
    );
  }
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={copy.title}
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
