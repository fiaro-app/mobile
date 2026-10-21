import { EmptyState } from '@/components/molecules/EmptyState';
import { PlanView } from '@/components/organisms/PlanView';
import { ClientDetailSkeleton } from '@/components/organisms/ClientDetailSkeleton';
import { AdminTemplate } from '@/components/templates/AdminTemplate';
import { PLAN_COPY } from '@/features/plan/content/messages';
import { usePlanScreen } from '@/features/plan/hooks/use-plan-screen';
import { PLAN_OFFERS } from '@/features/plan/lib/plan-view';
import { openRenewal } from '@/features/settings/lib/renew';
import { useAdminMenu } from '@/features/workspace/hooks/use-admin-menu';
import { formatCop } from '@/lib/format-cop';

/** Ruta `/admin/plan`: «Plan y pagos» (el plan en curso, los planes que se ofrecen y el historial de pagos); pagar se hace en la web. */
export default function PlanScreen() {
  const menu = useAdminMenu('plan');
  const screen = usePlanScreen();
  const copy = PLAN_COPY;
  let body = <ClientDetailSkeleton />;
  if (screen.failed) {
    body = <EmptyState icon="alert-circle-outline" title={copy.loadFailedTitle} message={copy.loadFailedMessage} actionLabel="Reintentar" onAction={screen.refresh} />;
  } else if (screen.plan) {
    body = (
      <PlanView
        texts={{ ...copy, perMonth: copy.perMonth }}
        plan={screen.plan}
        currentCode={screen.currentCode}
        offers={PLAN_OFFERS.map((offer) => ({ code: offer.code, name: offer.name, price: formatCop(offer.monthlyPrice), tagline: offer.tagline, features: offer.features }))}
        payments={screen.payments}
        paymentsLoading={screen.paymentsLoading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        onPay={openRenewal}
      />
    );
  }
  return (
    <AdminTemplate title={copy.title} initials={menu.initials} drawer={menu.drawer} onMenu={menu.open} onAvatar={menu.goToAccount}>
      {body}
    </AdminTemplate>
  );
}
