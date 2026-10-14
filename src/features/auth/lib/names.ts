/** Primer nombre de un nombre completo (`"Alejo Pérez"` → `"Alejo"`), para saludar. */
export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

/**
 * Iniciales para el avatar: la primera letra del primer y del último nombre, en mayúscula
 * (`"Juan Alejo Pérez"` → `"JP"`). Con una sola palabra, solo su inicial.
 */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}
