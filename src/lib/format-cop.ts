/**
 * Formats an integer amount of Colombian pesos (no decimals) as `$1.234.567`.
 */
export function formatCop(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-CO')}`;
}
