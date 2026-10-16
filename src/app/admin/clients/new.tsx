import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { useConfirmedSubmit } from '@/lib/hooks/use-confirmed-submit';
import { CONFIRM_COPY } from '@/lib/content/confirm-messages';
import { useRouter } from 'expo-router';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientFormView } from '@/components/organisms/ClientFormView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { CLIENTS_COPY } from '@/features/clients/content/messages';
import { useClientForm } from '@/features/clients/hooks/use-client-form';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/clients/new`: registrar un cliente; al terminar abre su ficha (reemplaza esta pantalla). */
export default function NewClientScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const form = useClientForm(undefined, (client) => {
    router.replace({ pathname: '/admin/clients/[id]', params: { id: client.id } });
  });
  const confirm = useConfirmedSubmit(form.submit, CONFIRM_COPY.create);
  const copy = CLIENTS_COPY.form;
  const back = () => {
    goBack();
  };
  return (
    <ScreenTemplate topBar={<TopBar title={CLIENTS_COPY.register} onBack={back} />}>
      <ClientFormView
        intro={copy.registerIntro}
        texts={copy}
        submitLabel={copy.submit}
        fullName={form.fullName}
        nationalId={form.nationalId}
        phone={form.phone}
        occupation={form.occupation}
        address={form.address}
        submitting={form.submitting}
        formError={form.formError}
        notice={form.notice}
        onSubmit={confirm.ask}
        onCancel={back}
      />
      <ConfirmDialog {...confirm.dialog} />
    </ScreenTemplate>
  );
}
