import { contrastWithWhite, MIN_BRAND_CONTRAST } from '@/features/settings/lib/color';
import { DEFAULT_BRAND_COLOR } from '@/lib/theme/brand';

/** Un color elegible. */
export interface BrandSwatch {
  readonly value: string;
  readonly label: string;
}

/** Paleta ofrecida (la misma de la web); todos pasan el contraste mínimo con texto blanco. */
export const BRAND_PALETTE: readonly BrandSwatch[] = [
  { value: DEFAULT_BRAND_COLOR, label: 'Índigo Fiaro' },
  { value: '#1D4ED8', label: 'Azul' },
  { value: '#0F766E', label: 'Verde azulado' },
  { value: '#B45309', label: 'Cobre' },
  { value: '#9F1239', label: 'Vino' },
  { value: '#1C1B2E', label: 'Negro' },
];

/** Si el color guardado no está en la paleta (se eligió desde la web), se agrega para que se vea seleccionado. */
export function swatchesFor(current: string | null): readonly BrandSwatch[] {
  if (current === null || BRAND_PALETTE.some((swatch) => swatch.value.toUpperCase() === current.toUpperCase())) return BRAND_PALETTE;
  return [...BRAND_PALETTE, { value: current.toUpperCase(), label: 'Personalizado' }];
}

/** Mensaje si el color no sirve (formato o contraste), o `null` si es válido. */
export function brandColorError(hex: string): string | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return 'Elige un color válido.';
  return contrastWithWhite(hex) >= MIN_BRAND_CONTRAST ? null : 'Elige un color más oscuro para que el texto blanco se lea bien.';
}
