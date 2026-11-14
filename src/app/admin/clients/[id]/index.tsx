import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { ClientProfileView } from '@/components/organisms/ClientProfileView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { AttachmentPanel } from '@/features/attachments/components/AttachmentPanel';
import { ATTACHMENT_COPY } from '@/features/attachments/content/messages';
import { CLIENTS_COPY } from '@/features/clients/content/messages';
import { toRiskCardProps } from '@/features/risk/lib/risk-view';
import { useClientProfile } from '@/features/clients/hooks/use-client-profile';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/admin/clients/[id]`: ficha del cliente con sus datos, sus préstamos y los accesos para llamar o editar. */
export default function ClientProfileScreen() {
  const router = useRouter();
  const goBack = useGoBack();
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
        risk={profile.risk ? toRiskCardProps(profile.risk) : null}
        extra={
          <AttachmentPanel
            target="client"
            id={id}
            canEdit
            title={ATTACHMENT_COPY.clientPhoto.title}
            description={ATTACHMENT_COPY.clientPhoto.description}
            alt={ATTACHMENT_COPY.clientPhoto.alt(client.name)}
            none={ATTACHMENT_COPY.clientPhoto.none}
          />
        }
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
            goBack();
          }}
        />
      }
    >
      {body}
    </ScreenTemplate>
  );
}
