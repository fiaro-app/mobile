import { Uniwind } from 'uniwind';
import { applyBrandColor, DEFAULT_BRAND_COLOR, resetBrandColor } from '@/lib/theme/brand';

jest.mock('uniwind', () => ({ Uniwind: { updateCSSVariables: jest.fn() } }));

describe('brand', () => {
  it('aplica el color al tema claro', () => {
    applyBrandColor('#0F766E');
    expect(Uniwind.updateCSSVariables).toHaveBeenCalledWith('light', { '--color-primary': '#0F766E' });
  });

  it('restaura el anil de Fiaro', () => {
    resetBrandColor();
    expect(Uniwind.updateCSSVariables).toHaveBeenCalledWith('light', {
      '--color-primary': DEFAULT_BRAND_COLOR,
    });
  });
});
