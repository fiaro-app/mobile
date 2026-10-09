import { Linking } from 'react-native';
import { callClient } from '@/features/client-detail/lib/call';

describe('callClient', () => {
  it('abre el marcador con el número', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    expect(await callClient('+573001234567')).toBe(true);
    expect(open).toHaveBeenCalledWith('tel:+573001234567');
    open.mockRestore();
  });

  it('devuelve false si el dispositivo no puede llamar', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no puede'));
    expect(await callClient('+573001234567')).toBe(false);
    open.mockRestore();
  });
});
