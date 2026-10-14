import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { RegisterVisitView } from '@/components/organisms/RegisterVisitView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { VISIT_COPY } from '@/features/visit/content/messages';
import { useRegisterVisit } from '@/features/visit/hooks/use-register-visit';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/visit/[loanId]?clientId=...`: registrar el resultado de una visita de cobro. */
export default function RegisterVisitScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { loanId, clientId } = useLocalSearchParams<{ loanId: string; clientId: string }>();
  const visit = useRegisterVisit(clientId, loanId, (done) => {
    router.replace({ pathname: '/visit-done', params: { kind: done.kind, paid: done.paid ? '1' : '0' } });
  });
  const model = visit.model;

  let body = <ClientDetailSkeleton />;
  if (model) {
    body = (
      <RegisterVisitView
        status={model.status}
        summary={`Saldo total ${model.balanceLabel} · ${model.overdueLabel} de mora`}
        amountLabel={VISIT_COPY.installmentToday}
        amountHint={VISIT_COPY.amountHint}
        amountText={visit.amountText}
        amountError={visit.amountError}
        onAmount={visit.setAmount}
        methodTitle={VISIT_COPY.methodTitle}
        methods={VISIT_COPY.methods}
        method={visit.method}
        onMethod={(value) => {
          visit.setMethod(value as typeof visit.method);
        }}
        slideLabel={VISIT_COPY.slide}
        submitting={visit.submitting}
        onSlideConfirm={visit.requestConfirm}
        otherLabel={VISIT_COPY.otherOutcome}
        onOther={visit.openOutcomeSheet}
        formError={visit.formError}
        confirm={{
          visible: visit.confirmOpen,
          title: VISIT_COPY.confirm.title,
          message: visit.confirmText,
          cancelLabel: VISIT_COPY.confirm.cancel,
          confirmLabel: VISIT_COPY.confirm.accept,
          onCancel: visit.cancelConfirm,
          onConfirm: visit.confirmPayment,
        }}
        outcomeSheet={{
          visible: visit.sheet === 'outcome',
          title: VISIT_COPY.outcomeSheet.title,
          options: VISIT_COPY.outcomeSheet.options,
          onChoose: (value) => {
            visit.chooseOutcome(value as 'NOT_FOUND' | 'REFUSED' | 'RESCHEDULED');
          },
          onClose: visit.closeSheet,
        }}
        reschedule={{
          visible: visit.sheet === 'reschedule',
          title: VISIT_COPY.reschedule.title,
          subtitle: `${model.name} · cuota de ${model.installmentLabel}`,
          dateLabel: VISIT_COPY.reschedule.dateLabel,
          hint: VISIT_COPY.reschedule.hint,
          cancelLabel: VISIT_COPY.reschedule.cancel,
          saveLabel: VISIT_COPY.reschedule.save,
          options: visit.dateOptions,
          selected: visit.rescheduleDate,
          onSelect: visit.setRescheduleDate,
          onCancel: visit.closeSheet,
          onSave: visit.saveReschedule,
        }}
      />
    );
  } else if (!visit.ready && visit.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title="No pudimos cargar al cliente" message="Revisa tu conexión e intenta de nuevo." />;
  }

  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={model?.name ?? 'Registrar visita'}
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
