import { Uniwind } from 'uniwind';

/** Color de marca por defecto: el anil de Fiaro (`color.marca.anil` del diseño). */
export const DEFAULT_BRAND_COLOR = '#3B3382';

/**
 * Reemplaza en ejecución el color de marca (`--color-primary`) de todos los componentes, sin
 * recompilar. Pensado para el color propio de cada Lender cuando el API lo exponga (D-102 del
 * backend: todavía no existe ese campo, por eso nadie lo llama aún). El hover no existe en móvil:
 * el estado "presionado" usa opacidad, así que basta con una sola variable.
 *
 * @param hex - Color en hexadecimal (`#3B3382`).
 */
export function applyBrandColor(hex: string): void {
  Uniwind.updateCSSVariables('light', { '--color-primary': hex });
}

/** Vuelve al color de marca de Fiaro, por ejemplo al cerrar sesión. */
export function resetBrandColor(): void {
  applyBrandColor(DEFAULT_BRAND_COLOR);
}
