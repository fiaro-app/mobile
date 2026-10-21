import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as planApi from '@/features/plan/api/plan-api';
import { usePlanScreen } from '@/features/plan/hooks/use-plan-screen';
import * as settingsApi from '@/features/settings/api/settings-api';

jest.mock('@/features/plan/api/plan-api', () => ({ fetchPlanPayments: jest.fn() }));
jest.mock('@/features/settings/api/settings-api', () => ({ fetchSubscription: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const SUBSCRIPTION = { planCode: 'PRO', status: 'ACTIVE', currentPeriodEndsAt: '2026-11-20T00:00:00Z', daysRemaining: 30, graceDaysRemaining: 0, isReadOnly: false, limits: { maxCollectors: 10, maxAdmins: 3, maxPortfolios: 4, maxActiveLoans: null }, usage: { activeCollectors: 2, activeAdmins: 1, activeLoans: 5 } };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('usePlanScreen', () => {
  it('joins the plan with its usage and the payment history', async () => {
    jest.mocked(settingsApi.fetchSubscription).mockResolvedValue({ ok: true, value: SUBSCRIPTION } as never);
    jest.mocked(planApi.fetchPlanPayments).mockResolvedValue({ ok: true, value: [{ reference: 'r1', planCode: 'PRO', status: 'APPROVED', amountInCents: 6_900_000, createdAt: '2026-10-20T15:00:00Z', resolvedAt: null, periodEndsAt: null, paymentMethodType: 'CARD' }] });

    const { result } = await renderHook(() => usePlanScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.paymentsLoading).toBe(false);
    });

    expect(result.current.currentCode).toBe('PRO');
    expect(result.current.plan?.bars.length).toBeGreaterThan(0);
    expect(result.current.payments[0]?.amount).toBe('$69.000');
  });

  it('flags a failure to load the plan', async () => {
    jest.mocked(settingsApi.fetchSubscription).mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    jest.mocked(planApi.fetchPlanPayments).mockResolvedValue({ ok: true, value: [] });

    const { result } = await renderHook(() => usePlanScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.failed).toBe(true);
    });
  });
});
