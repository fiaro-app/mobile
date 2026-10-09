import { act, renderHook } from '@testing-library/react-native';
import * as biometrics from '@/features/auth/api/biometrics';
import * as vault from '@/features/auth/api/pin-vault';
import { usePinUnlock } from '@/features/auth/hooks/use-pin-unlock';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/auth/api/biometrics', () => ({
  isBiometricAvailable: jest.fn(),
  authenticateWithBiometrics: jest.fn(),
}));
jest.mock('@/features/auth/api/pin-vault', () => ({ verifyPin: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({
  completePinExhausted: jest.fn(),
  completeSignOut: jest.fn(),
}));

const user = { id: '1', fullName: 'Alejo Pérez', phone: '+573001234567', mustChangePassword: false };
const bio = jest.mocked(biometrics);
const pins = jest.mocked(vault);

async function enter(result: { current: ReturnType<typeof usePinUnlock> }, digits: string) {
  for (const digit of digits) {
    await act(async () => {
      result.current.entry.press(digit);
    });
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  bio.isBiometricAvailable.mockResolvedValue(false);
  useSessionStore.getState().restore({ user, pinEnabled: true, pinOfferPending: false });
});

describe('usePinUnlock', () => {
  it('saluda con el primer nombre y las iniciales', async () => {
    const { result } = await renderHook(() => usePinUnlock());
    expect(result.current).toMatchObject({ name: 'Alejo', initials: 'AP', error: null });
  });

  it('desbloquea con el PIN correcto', async () => {
    pins.verifyPin.mockResolvedValue('ok');
    const { result } = await renderHook(() => usePinUnlock());
    await enter(result, '1234');
    expect(useSessionStore.getState().unlocked).toBe(true);
  });

  it('avisa del PIN incorrecto, limpia los puntos y el aviso se va al teclear', async () => {
    pins.verifyPin.mockResolvedValue('wrong');
    const { result } = await renderHook(() => usePinUnlock());
    await enter(result, '0000');
    expect(result.current.error).toBe('PIN incorrecto. Intenta de nuevo.');
    expect(result.current.entry.digits).toBe('');
    await enter(result, '1');
    expect(result.current.error).toBeNull();
  });

  it('vuelve al login al agotar los intentos', async () => {
    pins.verifyPin.mockResolvedValue('exhausted');
    const { result } = await renderHook(() => usePinUnlock());
    await enter(result, '0000');
    expect(actions.completePinExhausted).toHaveBeenCalled();
  });

  it('ofrece la huella sola y desbloquea si la reconoce', async () => {
    bio.isBiometricAvailable.mockResolvedValue(true);
    bio.authenticateWithBiometrics.mockResolvedValue(true);
    const { result } = await renderHook(() => usePinUnlock());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.biometricAvailable).toBe(true);
    expect(useSessionStore.getState().unlocked).toBe(true);
  });

  it('permite pedir la huella a mano y volver a contraseña', async () => {
    bio.isBiometricAvailable.mockResolvedValue(true);
    bio.authenticateWithBiometrics.mockResolvedValue(false);
    const { result } = await renderHook(() => usePinUnlock());
    await act(async () => {
      result.current.onBiometrics();
      result.current.onUsePassword();
    });
    expect(bio.authenticateWithBiometrics).toHaveBeenCalledTimes(2);
    expect(actions.completeSignOut).toHaveBeenCalled();
  });
});
