import { useLocalSearchParams, useRouter } from 'expo-router';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientPickerSheet } from '@/components/organisms/ClientPickerSheet';
import { LoanFormView } from '@/components/organisms/LoanFormView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { useClientPicker } from '@/features/clients/hooks/use-client-picker';
import { LOANS_COPY } from '@/features/loans/content/messages';
import { useLoanForm } from '@/features/loans/hooks/use-loan-form';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/loans/new?clientId=...`: crear un préstamo (el cliente puede venir precargado desde su ficha). */
export default function NewLoanScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const openLoan = (id: string) => {
    router.replace({ pathname: '/admin/loans/[id]', params: { id } });
  };
  const form = useLoanForm(clientId ?? '', openLoan);
  const picker = useClientPicker(form.sheet === 'client');
  const copy = LOANS_COPY.form;
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={LOANS_COPY.newLoan}
          onBack={() => {
            goBack();
          }}
        />
      }
    >
      <LoanFormView
        values={form.values}
        errors={form.errors}
        labels={{ client: form.clientLabel, frequency: form.frequencyLabel, startDate: form.startDateLabel, collector: form.collectorLabel }}
        texts={copy}
        totalSuggested={form.totalSuggested}
        submitting={form.submitting}
        formError={form.formError}
        createdLoanId={form.createdLoanId}
        sheets={{ active: form.sheet, frequency: form.frequencyOptions, today: form.today, collector: form.collectorOptions, onClose: form.closeSheet }}
        onOpen={form.openSheet}
        onAmount={form.setAmount}
        onCount={form.setCount}
        onFrequency={form.setFrequency}
        onStartDate={form.setStartDate}
        onCollector={form.setCollector}
        onSubmit={form.submit}
        onCancel={() => {
          goBack();
        }}
        onSeeLoan={() => {
          if (form.createdLoanId) openLoan(form.createdLoanId);
        }}
      />
      <ClientPickerSheet
        visible={form.sheet === 'client'}
        title={copy.clientSheet}
        placeholder="Buscar por nombre o cédula"
        emptyText="No encontramos clientes con esa búsqueda."
        search={picker.search}
        onSearch={picker.setSearch}
        options={picker.options}
        loading={picker.loading}
        onSelect={form.setClient}
        onClose={form.closeSheet}
      />
    </ScreenTemplate>
  );
}
