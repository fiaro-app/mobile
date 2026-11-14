import { useSubscription } from '@/features/settings/hooks/use-settings-data';

/** Qué trae el plan del negocio, para mostrar u ocultar pantallas. El API es quien niega (`PLAN_FEATURE_UNAVAILABLE`). */
export interface PlanFeatures {
  /** El PDF de estadísticas, el comparativo y los reportes de riesgo, mora y desempeño. */
  readonly advancedStats: boolean;
}

/**
 * Las funciones del plan, desde `GET /subscription`. Mientras el plan no llega (o si no se pudo leer) se asume el
 * completo: no se le quita nada a nadie por una consulta lenta, y si el plan no lo trae el API lo niega igual.
 */
export function usePlanFeatures(): PlanFeatures {
  const subscription = useSubscription();
  const features = subscription.data?.features;
  return { advancedStats: features === undefined || features.includes('ADVANCED_STATS') };
}
