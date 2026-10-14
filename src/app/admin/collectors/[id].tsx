import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { EmptyState } from '@/components/molecules/EmptyState';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { CollectorManageView } from '@/components/organisms/CollectorManageView';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { COLLECTORS_COPY } from '@/features/collectors/content/messages';
import { useCollectorManage } from '@/features/collectors/hooks/use-collector-manage';

const copyOf = COLLECTORS_COPY.manage;

/** Diálogos de confirmación de la pantalla. */
type Confirmation = 'reset' | 'deactivate' | 'reactivate' | 'remove';
interface ConfirmationCopy {
  readonly title: string;
  readonly message: (name: string) => string;
  readonly confirm: string;
}
const CONFIRMATIONS: Record<Confirmation, ConfirmationCopy> = {
  reset: { title: copyOf.resetTitle, message: copyOf.resetMessage, confirm: copyOf.resetConfirm },
  deactivate: { title: copyOf.deactivateTitle, message: copyOf.deactivateMessage, confirm: copyOf.deactivateConfirm },
  reactivate: { title: copyOf.reactivateTitle, message: copyOf.reactivateMessage, confirm: copyOf.reactivateConfirm },
  remove: { title: copyOf.removeTitle, message: copyOf.removeMessage, confirm: copyOf.removeConfirm },
};

const isConfirmation = (dialog: string): dialog is Confirmation => dialog in CONFIRMATIONS;

/** Ruta `/admin/collectors/[id]`: gestionar un cobrador (desempeño, cartera, contraseña temporal, desactivar, reactivar, borrar). */
export default function ManageCollectorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const manage = useCollectorManage(id);
  const copy = COLLECTORS_COPY.manage;

  useEffect(() => {
    if (manage.removed) router.back();
  }, [manage.removed, router]);

  let body = <ClientDetailSkeleton />;
  if (manage.notFound) {
    body = <EmptyState icon="person-remove-outline" title={copy.notFoundTitle} message={copy.notFoundMessage} />;
  } else if (manage.person) {
    const person = manage.person;
    const dialog = isConfirmation(manage.dialog) ? manage.dialog : null;
    const loans = manage.activeLoanCount ?? 0;
    const message = dialog === 'deactivate' && loans > 0 ? copy.handoverMessage(person.name, loans) : dialog && CONFIRMATIONS[dialog].message(person.name);
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
        reactivateLabel={copy.reactivate}
        onReactivate={() => {
          manage.openDialog('reactivate');
        }}
        removeLabel={person.isOwner ? null : copy.remove}
        onRemove={() => {
          manage.openDialog('remove');
        }}
        dialog={{
          visible: dialog !== null,
          title: dialog ? CONFIRMATIONS[dialog].title : '',
          message: message || '',
          cancelLabel: copy.cancel,
          confirmLabel: dialog ? CONFIRMATIONS[dialog].confirm : '',
          onCancel: manage.closeDialog,
          onConfirm: { reset: manage.confirmReset, deactivate: manage.confirmDeactivate, reactivate: manage.confirmReactivate, remove: manage.confirmRemove }[dialog ?? 'reset'],
          destructive: dialog === 'deactivate' || dialog === 'remove',
        }}
        destinationSheet={{
          visible: manage.dialog === 'destination',
          title: copy.handoverTitle,
          options: manage.destinationOptions,
          selected: '',
          onSelect: manage.chooseDestination,
          onClose: manage.closeDialog,
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
