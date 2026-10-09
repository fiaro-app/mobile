import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { SettlementView } from '@/components/organisms/SettlementView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { SETTLEMENT_COPY } from '@/features/settlement/content/messages';
import { useSettlementScreen } from '@/features/settlement/hooks/use-settlement-screen';

const REVIEW_KIND = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' } as const;

/** Ruta `/settlement`: el cobrador declara lo cobrado del día y lo envía a su prestamista. */
export default function SettlementScreen() {
  const router = useRouter();
  const screen = useSettlementScreen();
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
        confirm={{
          visible: screen.confirmOpen,
          title: SETTLEMENT_COPY.confirmTitle,
          message: `${screen.collectedLabel} de ${screen.expectedLabel} esperados. ${screen.differenceText}.`,
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
            router.back();
          }}
        />
      }
    >
      {body}
    </ScreenTemplate>
  );
}
