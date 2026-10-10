function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

/**
 * Contraste de un `#rrggbb` contra el blanco (de 1 a 21). El texto de los botones es blanco sobre el color de marca, así que
 * WCAG AA pide al menos 4.5 (`MIN_BRAND_CONTRAST`): un color muy claro dejaría los botones ilegibles.
 */
export function contrastWithWhite(hex: string): number {
  return 1.05 / (relativeLuminance(hex) + 0.05);
}

/** Contraste mínimo del texto blanco sobre el color de marca (WCAG AA para texto normal). */
export const MIN_BRAND_CONTRAST = 4.5;
