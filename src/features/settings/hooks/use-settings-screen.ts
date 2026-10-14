import { useMemo } from 'react';
import { usePortfolios } from '@/features/collectors/hooks/use-portfolios';
import { useBrandSettings, useBusinessSettings } from '@/features/settings/hooks/use-business-settings';
import { useLogoSettings } from '@/features/settings/hooks/use-logo-settings';
import { useCollectionDays } from '@/features/settings/hooks/use-collection-days';
import { usePortfolioManager } from '@/features/settings/hooks/use-portfolio-manager';
import { useLenderSettings, useSubscription } from '@/features/settings/hooks/use-settings-data';
import { swatchesFor } from '@/features/settings/lib/brand-palette';
import { toSubscriptionView, type SubscriptionView } from '@/features/settings/lib/subscription-view';

/** Todo lo que Configuración necesita: carga y cada sección. */
export interface SettingsScreen {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly business: ReturnType<typeof useBusinessSettings>;
  readonly brand: ReturnType<typeof useBrandSettings>;
  readonly swatches: ReturnType<typeof swatchesFor>;
  readonly logo: ReturnType<typeof useLogoSettings>;
  readonly days: ReturnType<typeof useCollectionDays>;
  readonly portfolios: ReturnType<typeof usePortfolioManager>;
  readonly portfolioItems: readonly { id: string; name: string; isDefault: boolean }[];
  readonly plan: SubscriptionView | null;
  readonly refresh: () => void;
}

/** Une las secciones de Configuración. El plan es informativo: si no carga, simplemente no se muestra. */
export function useSettingsScreen(): SettingsScreen {
  const settings = useLenderSettings();
  const portfolioQuery = usePortfolios();
  const subscription = useSubscription();
  const portfolioItems = portfolioQuery.data ?? [];
  const plan = useMemo(() => (subscription.data ? toSubscriptionView(subscription.data) : null), [subscription.data]);
  return {
    loading: settings.isPending,
    loadFailed: settings.data === undefined && settings.isError,
    business: useBusinessSettings(settings.data),
    brand: useBrandSettings(settings.data),
    swatches: swatchesFor(settings.data?.brandColor ?? null),
    logo: useLogoSettings(settings.data),
    days: useCollectionDays(settings.data),
    portfolios: usePortfolioManager(portfolioItems),
    portfolioItems,
    plan,
    refresh: () => {
      void settings.refetch();
      void portfolioQuery.refetch();
      void subscription.refetch();
    },
  };
}
