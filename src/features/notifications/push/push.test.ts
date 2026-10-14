import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '@/features/notifications/api/notifications-api';
import * as expoPush from '@/features/notifications/push/expo-push';
import { registerPushForSession, releasePushToken } from '@/features/notifications/push/push-registration';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/features/notifications/api/notifications-api', () => ({ registerPushToken: jest.fn(), revokePushToken: jest.fn() }));
jest.mock('@/features/notifications/push/expo-push', () => ({ getExpoPushToken: jest.fn() }));

const a = jest.mocked(api);
const token = jest.mocked(expoPush.getExpoPushToken);
const TOKEN = 'ExponentPushToken[abc]';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  a.registerPushToken.mockResolvedValue({ ok: true, value: null });
  a.revokePushToken.mockResolvedValue({ ok: true, value: null });
});

describe('registro del token push', () => {
  it('registra y recuerda el token', async () => {
    token.mockResolvedValue(TOKEN);
    await registerPushForSession();
    expect(a.registerPushToken).toHaveBeenCalledWith(TOKEN);
    expect(await AsyncStorage.getItem('fiaro.push-token')).toBe(TOKEN);
  });

  it('sin token (Expo Go, permiso negado, sin proyecto) no hace nada', async () => {
    token.mockResolvedValue(null);
    await registerPushForSession();
    expect(a.registerPushToken).not.toHaveBeenCalled();
  });

  it('si el API falla no lo recuerda', async () => {
    token.mockResolvedValue(TOKEN);
    a.registerPushToken.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    await registerPushForSession();
    expect(await AsyncStorage.getItem('fiaro.push-token')).toBeNull();
  });

  it('al cerrar sesión revoca el token guardado y lo olvida', async () => {
    await AsyncStorage.setItem('fiaro.push-token', TOKEN);
    await releasePushToken();
    expect(a.revokePushToken).toHaveBeenCalledWith(TOKEN);
    expect(await AsyncStorage.getItem('fiaro.push-token')).toBeNull();
  });

  it('si revocar falla (sin red) conserva el token; sin token no pide nada', async () => {
    await releasePushToken();
    expect(a.revokePushToken).not.toHaveBeenCalled();
    await AsyncStorage.setItem('fiaro.push-token', TOKEN);
    a.revokePushToken.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    await releasePushToken();
    expect(await AsyncStorage.getItem('fiaro.push-token')).toBe(TOKEN);
  });
});
