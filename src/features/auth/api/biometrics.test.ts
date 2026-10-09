import * as LocalAuthentication from 'expo-local-authentication';
import { authenticateWithBiometrics, isBiometricAvailable } from '@/features/auth/api/biometrics';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const local = jest.mocked(LocalAuthentication);

describe('isBiometricAvailable', () => {
  it.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
  ])('hardware=%s inscrito=%s -> %s', async (hardware, enrolled, expected) => {
    local.hasHardwareAsync.mockResolvedValue(hardware);
    local.isEnrolledAsync.mockResolvedValue(enrolled);
    expect(await isBiometricAvailable()).toBe(expected);
  });
});

describe('authenticateWithBiometrics', () => {
  it('devuelve el éxito del sistema', async () => {
    local.authenticateAsync.mockResolvedValue({ success: true });
    expect(await authenticateWithBiometrics()).toBe(true);
  });

  it('devuelve false si cancela o falla, sin lanzar', async () => {
    local.authenticateAsync.mockResolvedValueOnce({ success: false, error: 'user_cancel' });
    expect(await authenticateWithBiometrics()).toBe(false);
    local.authenticateAsync.mockRejectedValueOnce(new Error('boom'));
    expect(await authenticateWithBiometrics()).toBe(false);
  });
});
