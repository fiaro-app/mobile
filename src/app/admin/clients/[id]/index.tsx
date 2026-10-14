import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { ClientProfileView } from '@/components/organisms/ClientProfileView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { CLIENTS_COPY } from '@/features/clients/content/messages';
import { useClientProfile } from '@/features/clients/hooks/use-client-profile';

/** Ruta `/admin/clients/[id]`: ficha del cliente con sus datos, sus préstamos y los accesos para llamar o editar. */
export default function ClientProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useClientProfile(id);
  const copy = CLIENTS_COPY.profile;

  let body = <ClientDetailSkeleton />;
  if (profile.notFound) {
    body = <EmptyState icon="person-remove-outline" title={copy.notFoundTitle} message={copy.notFoundMessage} />;
  } else if (profile.loadFailed) {
    body = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={CLIENTS_COPY.loadFailedMessage} actionLabel="Reintentar" onAction={profile.refresh} />;
  } else if (profile.client) {
    const client = profile.client;
    body = (
      <ClientProfileView
        client={client}
        info={[
          { label: copy.phone, value: client.phone },
          { label: copy.address, value: client.address },
          { label: copy.occupation, value: client.occupation },
        ]}
        callLabel={copy.call}
        editLabel={copy.edit}
        onCall={profile.call}
        onEdit={() => {
          router.push({ pathname: '/admin/clients/[id]/edit', params: { id } });
        }}
        notice={profile.notice}
        loansTitle={copy.loans}
        loansEmpty={copy.noLoans}
        loans={profile.loans}
        loansLoading={profile.loansLoading}
        newLoanLabel={copy.newLoan}
        onNewLoan={() => {
          router.push({ pathname: '/admin/loans/new', params: { clientId: id } });
        }}
      />
    );
  }
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={copy.title}
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
