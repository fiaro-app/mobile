/**
 * Une clases de Tailwind ignorando los valores vacíos (`false`, `null`, `undefined`).
 * Es el mismo ayudante, a propósito simple, que usa la web: no resuelve conflictos entre clases.
 *
 * @example
 * cn('px-4', invalid && 'border-destructive', className)
 */
export function cn(...classes: readonly (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
