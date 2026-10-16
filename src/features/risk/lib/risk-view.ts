import { RISK_COPY } from '@/features/risk/content/messages';
import type { RiskCardProps } from '@/components/molecules/RiskCard';
import type { ClientRisk, RiskLevel } from '@/features/risk/lib/risk-schemas';

/** Color del medidor según el nivel. */
export type RiskTone = 'success' | 'primary' | 'warning' | 'destructive';

/** El riesgo de un cliente listo para dibujar. */
export interface RiskView {
  readonly score: number;
  readonly level: RiskLevel;
  readonly levelLabel: string;
  readonly tone: RiskTone;
  /** Lo que lee un lector de pantalla del medidor. */
  readonly ariaLabel: string;
  readonly factors: readonly string[];
  readonly hasHistory: boolean;
}

const TONE_BY_LEVEL: Record<RiskLevel, RiskTone> = { LOW: 'success', MEDIUM: 'primary', HIGH: 'warning', VERY_HIGH: 'destructive' };

/** Convierte el riesgo del API en lo que dibujan la ficha, la lista y el aviso del préstamo. */
export function toRiskView(risk: ClientRisk): RiskView {
  const levelLabel = RISK_COPY.levels[risk.level];
  return {
    score: risk.score,
    level: risk.level,
    levelLabel,
    tone: TONE_BY_LEVEL[risk.level],
    ariaLabel: `Riesgo ${levelLabel}: ${String(risk.score)} de 100`,
    factors: risk.factors.map((factor) => RISK_COPY.factor(factor)),
    hasHistory: risk.loansCount > 0,
  };
}

/** Lo que dibuja `RiskCard` para un riesgo ya convertido; compartido por la ficha y el nuevo préstamo. */
export function toRiskCardProps(view: RiskView): RiskCardProps {
  return {
    title: RISK_COPY.title,
    levelLabel: view.levelLabel,
    gauge: { score: view.score, tone: view.tone, label: view.ariaLabel },
    factors: view.factors,
    noFactors: RISK_COPY.noFactors,
    noHistory: view.hasHistory ? null : RISK_COPY.noHistory,
  };
}
