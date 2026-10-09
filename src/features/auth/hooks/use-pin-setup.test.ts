import { act, renderHook } from '@testing-library/react-native';
import * as vault from '@/features/auth/api/pin-vault';
import { usePinSetup } from '@/features/auth/hooks/use-pin-setup';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/auth/api/pin-vault', () => ({
  savePin: jest.fn().mockResolvedValue(undefined),
  declinePin: jest.fn().mockResolvedValue(undefined),
}));

const user = { id: '1', fullName: 'Alejo Pérez', phone: '+573001234567', mustChangePassword: false };

async function enter(result: { current: ReturnType<typeof usePinSetup> }, digits: string) {
  for (const digit of digits) {
    await act(async () => {
      result.current.entry.press(digit);
    });
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.getState().signedIn({ user, pinEnabled: false, pinOfferPending: true });
});

describe('usePinSetup', () => {
  it('pasa de crear a confirmar y guarda el PIN si coincide', async () => {
    const { result } = await renderHook(() => usePinSetup());
    expect(result.current.step).toBe('create');
    await enter(result, '4821');
    expect(result.current.step).toBe('confirm');
    await enter(result, '4821');
    expect(vault.savePin).toHaveBeenCalledWith('4821');
    expect(useSessionStore.getState()).toMatchObject({ pinEnabled: true, pinOfferPending: false });
  });

  it('vuelve al primer paso con un aviso si no coincide', async () => {
    const { result } = await renderHook(() => usePinSetup());
    await enter(result, '4821');
    await enter(result, '1111');
    expect(result.current.step).toBe('create');
    expect(result.current.error).toBe('Los PIN no coinciden. Vuelve a intentarlo.');
    expect(vault.savePin).not.toHaveBeenCalled();
    await enter(result, '1');
    expect(result.current.error).toBeNull();
  });

  it('"Ahora no" recuerda la decisión y cierra la oferta', async () => {
    const { result } = await renderHook(() => usePinSetup());
    await act(async () => {
      result.current.onSkip();
      await Promise.resolve();
    });
    expect(vault.declinePin).toHaveBeenCalled();
    expect(useSessionStore.getState().pinOfferPending).toBe(false);
  });
});
