import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { CollectorManageView } from '@/components/organisms/CollectorManageView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { COLLECTORS_COPY } from '@/features/collectors/content/messages';
import { useCollectorManage } from '@/features/collectors/hooks/use-collector-manage';

/** Ruta `/admin/collectors/[id]`: gestionar un cobrador (desempeño, cartera, contraseña temporal, desactivar). */
export default function ManageCollectorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const manage = useCollectorManage(id);
  const copy = COLLECTORS_COPY.manage;

  let body = <ClientDetailSkeleton />;
  if (manage.notFound) {
    body = <EmptyState icon="person-remove-outline" title={copy.notFoundTitle} message={copy.notFoundMessage} />;
  } else if (manage.person) {
    const person = manage.person;
    const reset = manage.dialog === 'reset';
    body = (
      <CollectorManageView
        person={person}
        statusLabel={person.active ? 'ACTIVO' : 'INACTIVO'}
        inactiveNote={copy.inactiveNote}
        error={manage.error}
        notice={manage.notice}
        statsTitle={copy.statsTitle}
        statsPeriod={manage.stats?.period ?? null}
        stats={manage.stats?.cards ?? []}
        portfolioLabel={copy.portfolio}
        portfolioValue={manage.portfolioLabel}
        portfolioChanged={manage.portfolioChanged}
        savePortfolioLabel={copy.savePortfolio}
        onOpenPortfolio={() => {
          manage.openDialog('portfolio');
        }}
        onSavePortfolio={manage.savePortfolio}
        resetLabel={copy.resetPassword}
        deactivateLabel={copy.deactivate}
        onReset={() => {
          manage.openDialog('reset');
        }}
        onDeactivate={() => {
          manage.openDialog('deactivate');
        }}
        busy={manage.busy}
        secret={
          manage.tempPassword
            ? { title: copy.tempTitle, secret: manage.tempPassword, hint: COLLECTORS_COPY.registered.passwordHint, actionLabel: COLLECTORS_COPY.registered.share, onAction: manage.shareTempPassword }
            : null
        }
        dialog={{
          visible: manage.dialog === 'reset' || manage.dialog === 'deactivate',
          title: reset ? copy.resetTitle : copy.deactivateTitle,
          message: reset ? copy.resetMessage(person.name) : copy.deactivateMessage(person.name),
          cancelLabel: copy.cancel,
          confirmLabel: reset ? copy.resetConfirm : copy.deactivateConfirm,
          onCancel: manage.closeDialog,
          onConfirm: reset ? manage.confirmReset : manage.confirmDeactivate,
          destructive: !reset,
        }}
        portfolioSheet={{
          visible: manage.dialog === 'portfolio',
          title: copy.portfolio,
          options: manage.portfolioOptions,
          selected: manage.portfolioId,
          onSelect: manage.choosePortfolio,
          onClose: manage.closeDialog,
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
