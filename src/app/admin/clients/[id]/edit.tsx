import { useLocalSearchParams } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { ClientFormView } from '@/components/organisms/ClientFormView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { CLIENTS_COPY } from '@/features/clients/content/messages';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/clients/[id]/edit`: editar los datos de un cliente (solo se envía lo que cambió). */
export default function EditClientScreen() {
  const goBack = useGoBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const form = useClientForm(id, () => undefined);
  const copy = CLIENTS_COPY.form;
  const back = () => {
    goBack();
  };

  let body = <ClientDetailSkeleton />;
  if (form.notFound) {
    body = <EmptyState icon="person-remove-outline" title={CLIENTS_COPY.profile.notFoundTitle} message={CLIENTS_COPY.profile.notFoundMessage} />;
  } else if (!form.loading) {
    body = (
      <ClientFormView
        intro={null}
        texts={copy}
        submitLabel={copy.save}
        fullName={form.fullName}
        nationalId={form.nationalId}
        phone={form.phone}
        occupation={form.occupation}
        address={form.address}
        submitting={form.submitting}
        formError={form.formError}
        notice={form.notice}
        onSubmit={form.submit}
        onCancel={back}
      />
    );
  }
  return <ScreenTemplate topBar={<TopBar title={copy.editTitle} onBack={back} />}>{body}</ScreenTemplate>;
}
