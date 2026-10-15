import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { SettlementView } from '@/components/organisms/SettlementView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { SETTLEMENT_COPY } from '@/features/settlement/content/messages';
import { useCancelSettlement } from '@/features/settlement/hooks/use-cancel-settlement';
import { useSettlementScreen } from '@/features/settlement/hooks/use-settlement-screen';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

const REVIEW_KIND = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' } as const;

/** Ruta `/settlement`: el cobrador declara lo cobrado del día y lo envía a su prestamista. */
export default function SettlementScreen() {
  const goBack = useGoBack();
  const screen = useSettlementScreen();
  const cancel = useCancelSettlement();
  const { form } = screen;

  let body = <ClientDetailSkeleton />;
  if (screen.loadFailed) {
    body = (
      <EmptyState
        icon="alert-circle-outline"
        title={SETTLEMENT_COPY.loadFailedTitle}
        message={SETTLEMENT_COPY.loadFailedMessage}
        actionLabel="Reintentar"
        onAction={screen.retry}
      />
    );
  } else if (!screen.loading) {
    body = (
      <SettlementView
        expectedTitle={SETTLEMENT_COPY.expected}
        expectedLabel={screen.expectedLabel}
        collectedTitle={SETTLEMENT_COPY.collected}
        collectedLabel={screen.collectedLabel}
        differenceText={screen.differenceText}
        notice={
          screen.notice
            ? { kind: REVIEW_KIND[screen.notice.status], title: screen.notice.title, message: screen.notice.message, comment: screen.notice.reviewNote }
            : null
        }
        methodsTitle={SETTLEMENT_COPY.methodsTitle}
        amounts={[
          { key: 'cash', label: SETTLEMENT_COPY.cash, value: form.cash, onChange: (text) => { screen.setAmount('cash', text); } },
          { key: 'nequi', label: SETTLEMENT_COPY.nequi, value: form.nequi, onChange: (text) => { screen.setAmount('nequi', text); } },
          { key: 'transfer', label: SETTLEMENT_COPY.transfer, value: form.transfer, onChange: (text) => { screen.setAmount('transfer', text); } },
        ]}
        noteLabel={SETTLEMENT_COPY.noteLabel}
        notePlaceholder={SETTLEMENT_COPY.notePlaceholder}
        note={form.note}
        noteError={screen.noteError}
        onNote={screen.setNote}
        locked={screen.locked}
        formError={screen.formError}
        submitLabel={screen.submitLabel}
        submitting={screen.submitting}
        onSubmit={screen.requestSubmit}
        cancel={
          cancel.canCancel
            ? {
                label: SETTLEMENT_COPY.cancel,
                error: cancel.error,
                onPress: cancel.request,
                dialog: {
                  visible: cancel.dialogOpen,
                  title: SETTLEMENT_COPY.cancelTitle,
                  message: SETTLEMENT_COPY.cancelMessage,
                  cancelLabel: SETTLEMENT_COPY.cancelKeep,
                  confirmLabel: SETTLEMENT_COPY.cancel,
                  onCancel: cancel.dismiss,
                  onConfirm: cancel.confirm,
                  busy: cancel.busy,
                },
              }
            : null
        }
        confirm={{
          visible: screen.confirmOpen,
          title: SETTLEMENT_COPY.confirmTitle,
          message: `${screen.collectedLabel} de ${screen.expectedLabel} esperados. ${screen.differenceText}. ${SETTLEMENT_COPY.confirmWarning}`,
          cancelLabel: SETTLEMENT_COPY.confirmCancel,
          confirmLabel: SETTLEMENT_COPY.confirmAccept,
          onCancel: screen.cancelConfirm,
          onConfirm: screen.confirmSubmit,
        }}
      />
    );
  }

  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={SETTLEMENT_COPY.title}
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
