import { Linking } from 'react-native';
import { openRenewal, RENEW_LABEL, RENEW_URL } from '@/features/settings/lib/renew';
import { SITE_URL } from '@/lib/config';

describe('renovar el plan', () => {
  it('la renovación está en «Plan y pagos» de la web, no dentro de la app', () => {
    expect(RENEW_URL).toBe(`${SITE_URL}/plan`);
    expect(RENEW_LABEL).toBe('Renovar en la web');
  });

  it('abre esa dirección en el navegador', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    openRenewal();

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(RENEW_URL);
    open.mockRestore();
  });
});
