import { useSubscription } from '@/features/settings/hooks/use-settings-data';
import { toSubscriptionView, type SubscriptionView } from '@/features/settings/lib/subscription-view';
import { fetchPlanPayments } from '@/features/plan/api/plan-api';
import { toPaymentRows, type PaymentRow } from '@/features/plan/lib/plan-view';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/** Todo lo que «Plan y pagos» dibuja. */
export interface PlanScreen {
  readonly loading: boolean;
  readonly failed: boolean;
  readonly plan: SubscriptionView | null;
  readonly currentCode: string | null;
  readonly payments: PaymentRow[];
  readonly paymentsLoading: boolean;
  readonly refreshing: boolean;
  readonly refresh: () => void;
}

/** Lógica de «Plan y pagos»: el plan con su uso (el mismo de Configuración) y el historial de pagos. */
export function usePlanScreen(): PlanScreen {
  const subscription = useSubscription();
  const history = useApiQuery(['admin', 'plan-payments'], fetchPlanPayments);
  return {
    loading: subscription.isPending,
    failed: subscription.data === undefined && subscription.isError,
    plan: subscription.data ? toSubscriptionView(subscription.data) : null,
    currentCode: subscription.data?.planCode ?? null,
    payments: toPaymentRows(history.data ?? []),
    paymentsLoading: history.isPending,
    refreshing: subscription.isRefetching || history.isRefetching,
    refresh: () => {
      void subscription.refetch();
      void history.refetch();
    },
  };
}
