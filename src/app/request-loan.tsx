import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { LoanRequestFormView } from '@/components/organisms/LoanRequestFormView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { REQUEST_COPY } from '@/features/loan-requests/content/messages';
import { useRequestForm } from '@/features/loan-requests/hooks/use-request-form';
import { LOANS_COPY } from '@/features/loans/content/messages';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/request-loan`: el cobrador sugiere un préstamo al administrador (cliente nuevo o uno del negocio). */
export default function RequestLoanScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const form = useRequestForm();
  const copy = REQUEST_COPY.form;
  const loanCopy = LOANS_COPY.form;
  const back = () => {
    goBack();
  };
  return (
    <ScreenTemplate topBar={<TopBar title={copy.title} onBack={back} />}>
      {form.sent ? (
        <EmptyState
          icon="paper-plane-outline"
          title={REQUEST_COPY.sent.title}
          message={REQUEST_COPY.sent.message}
          actionLabel={REQUEST_COPY.sent.back}
          onAction={() => {
            router.replace('/');
          }}
        />
      ) : (
        <LoanRequestFormView
          values={form.values}
          errors={form.errors}
          lookup={form.lookup}
          labels={{ frequency: form.frequencyLabel, startDate: form.startDateLabel }}
          texts={{
            ...copy,
            principal: loanCopy.principal,
            count: loanCopy.count,
            installment: loanCopy.installment,
            total: loanCopy.total,
            totalHint: loanCopy.totalHint,
            frequency: loanCopy.frequency,
            startDate: loanCopy.startDate,
          }}
          totalSuggested={form.totalSuggested}
          submitting={form.submitting}
          formError={form.formError}
          sheets={{ active: form.sheet, frequency: form.frequencyOptions, today: form.today, onClose: form.closeSheet }}
          onNationalId={form.setNationalId}
          onSearch={form.search}
          onText={form.setText}
          onPhone={form.setPhone}
          onAmount={form.setAmount}
          onCount={form.setCount}
          onOpen={form.openSheet}
          onFrequency={form.setFrequency}
          onStartDate={form.setStartDate}
          onSubmit={form.submit}
          onCancel={back}
        />
      )}
    </ScreenTemplate>
  );
}
