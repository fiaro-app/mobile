import { canAdminister, canCollect, defaultMode, roleLabel } from '@/features/workspace/lib/roles';

describe('roles', () => {
  it('Owner y Lender administran; Collector cobra', () => {
    expect(canAdminister(['OWNER'])).toBe(true);
    expect(canAdminister(['LENDER', 'COLLECTOR'])).toBe(true);
    expect(canAdminister(['COLLECTOR'])).toBe(false);
    expect(canCollect(['COLLECTOR'])).toBe(true);
    expect(canCollect(['OWNER'])).toBe(false);
  });

  it('quien administra entra como administrador aunque también cobre', () => {
    expect(defaultMode(['OWNER', 'COLLECTOR'])).toBe('admin');
    expect(defaultMode(['COLLECTOR'])).toBe('collector');
    expect(defaultMode([])).toBe('collector');
  });

  it('etiqueta el rol', () => {
    expect(roleLabel(['LENDER'])).toBe('Administrador');
    expect(roleLabel(['COLLECTOR'])).toBe('Cobrador');
  });
});
