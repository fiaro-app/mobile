import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { fetchSubscription } from '@/features/settings/api/settings-api';
import { usePlanFeatures } from '@/features/settings/hooks/use-plan-features';

jest.mock('@/features/settings/api/settings-api', () => ({ fetchSubscription: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const SUBSCRIPTION = {
  planCode: 'INDIVIDUAL' as const,
  status: 'ACTIVE' as const,
  currentPeriodEndsAt: '2026-11-01T15:00:00Z',
  daysRemaining: 20,
  graceDaysRemaining: 7,
  isReadOnly: false,
  features: [] as ('ADVANCED_STATS' | 'EXCEL_IMPORT')[],
  limits: { maxCollectors: 2, maxAdmins: 1, maxPortfolios: 2, maxActiveLoans: 20 },
  usage: { activeCollectors: 0, activeAdmins: 1, activeLoans: 3 },
};

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePlanFeatures', () => {
  it('mientras el plan no llega, asume el completo: no le quita nada a nadie por una consulta lenta', async () => {
    jest.mocked(fetchSubscription).mockReturnValue(new Promise(() => undefined));
    const { result } = await renderHook(() => usePlanFeatures(), { wrapper });

    expect(result.current.advancedStats).toBe(true);
  });

  it('Individual no trae las estadísticas avanzadas', async () => {
    jest.mocked(fetchSubscription).mockResolvedValue({ ok: true, value: SUBSCRIPTION });
    const { result } = await renderHook(() => usePlanFeatures(), { wrapper });

    await waitFor(() => {
      expect(result.current.advancedStats).toBe(false);
    });
  });

  it('Pro sí las trae', async () => {
    jest.mocked(fetchSubscription).mockResolvedValue({ ok: true, value: { ...SUBSCRIPTION, planCode: 'PRO', features: ['ADVANCED_STATS', 'EXCEL_IMPORT'] } });
    const { result } = await renderHook(() => usePlanFeatures(), { wrapper });

    await waitFor(() => {
      expect(fetchSubscription).toHaveBeenCalled();
    });
    expect(result.current.advancedStats).toBe(true);
  });
});
