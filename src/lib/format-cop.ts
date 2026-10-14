const MILLION = 1_000_000;

/**
 * Formats an integer amount of Colombian pesos (no decimals) as `$1.234.567`; negatives as `-$30.000`
 * (la web los muestra igual: el signo va antes del `$`).
 */
export function formatCop(amount: number): string {
  const rounded = Math.round(amount);
  const text = `$${Math.abs(rounded).toLocaleString('es-CO')}`;
  return rounded < 0 ? `-${text}` : text;
}

/** Montos grandes en millones (`$18.4M`) para tarjetas angostas; por debajo del millón, el monto completo. */
export function formatCopCompact(amount: number): string {
  if (Math.abs(amount) < MILLION) return formatCop(amount);
  const millions = Math.round((amount / MILLION) * 10) / 10;
  const text = Math.abs(millions) >= 1000 ? Math.abs(millions).toLocaleString('es-CO') : String(Math.abs(millions));
  return `${millions < 0 ? '-' : ''}$${text}M`;
}

/** Proporción como porcentaje entero (`0.84` → `84 %`); `—` si no hay dato. */
export function formatPercent(ratio: number | null): string {
  return ratio === null ? '—' : `${String(Math.round(ratio * 100))} %`;
}
