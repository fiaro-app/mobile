import { fetchLenderSettings, fetchSubscription } from '@/features/settings/api/settings-api';
import { useApiQuery } from '@/lib/hooks/use-api-query';

/** Clave de la configuración del negocio. */
export const SETTINGS_KEY = ['admin', 'settings'] as const;

/** Configuración del negocio (nombre, color, días sin cobro). */
export const useLenderSettings = () => useApiQuery(SETTINGS_KEY, fetchLenderSettings);

/** El plan del negocio. */
export const useSubscription = () => useApiQuery(['admin', 'subscription'], fetchSubscription);
