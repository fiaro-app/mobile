import { CONSOLIDATED_COPY } from '@/features/consolidated/content/messages';
import type { Consolidated } from '@/features/consolidated/lib/consolidated-schemas';
import { formatCop, formatPercent } from '@/lib/format-cop';

/** Un negocio (o el total) con sus cifras ya formateadas. */
export interface ConsolidatedRow {
  readonly id: string;
  readonly name: string;
  readonly lines: readonly string[];
}

/** «Todos tus negocios» listo para dibujar. */
export interface ConsolidatedModel {
  readonly title: string;
  readonly rows: readonly ConsolidatedRow[];
}

const toRow = (id: string, name: string, figures: Consolidated['totals']): ConsolidatedRow => ({
  id,
  name,
  lines: [
    `${CONSOLIDATED_COPY.portfolio} ${formatCop(figures.totalPortfolio)} · ${CONSOLIDATED_COPY.atRisk} ${formatCop(figures.portfolioAtRisk)}`,
    `${CONSOLIDATED_COPY.arrears} ${formatPercent(figures.arrearsRate)} · ${CONSOLIDATED_COPY.collected} ${formatCop(figures.collectedAmount)} · ${CONSOLIDATED_COPY.effectiveness} ${formatPercent(figures.effectiveness)}`,
  ],
});

/** Convierte el consolidado del API en filas. Con un solo negocio devuelve `null`: repetiría las estadísticas y solo estorbaría. */
export function buildConsolidatedModel(consolidated: Consolidated): ConsolidatedModel | null {
  if (consolidated.lenders.length < 2) return null;
  return {
    title: CONSOLIDATED_COPY.title,
    rows: [...consolidated.lenders.map((lender) => toRow(lender.lenderId, lender.name, lender)), toRow('total', CONSOLIDATED_COPY.total, consolidated.totals)],
  };
}
