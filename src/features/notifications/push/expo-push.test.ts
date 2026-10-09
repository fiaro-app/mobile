import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getExpoPushToken } from '@/features/notifications/push/expo-push';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'bare', expoConfig: { extra: { eas: { projectId: 'proj-1' } } }, easConfig: null },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));

const n = jest.mocked(Notifications);
const constants = Constants as unknown as { executionEnvironment: string; expoConfig: { extra?: { eas?: { projectId?: string } } } | null; easConfig: { projectId?: string } | null };
const setPlatform = (os: string) => {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
};

beforeEach(() => {
  jest.clearAllMocks();
  setPlatform('android');
  constants.executionEnvironment = 'bare';
  constants.expoConfig = { extra: { eas: { projectId: 'proj-1' } } };
  constants.easConfig = null;
  n.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
  n.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]', type: 'expo' });
});

describe('getExpoPushToken', () => {
  it('devuelve el token y prepara el canal de Android', async () => {
    expect(await getExpoPushToken()).toBe('ExponentPushToken[abc]');
    expect(n.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.objectContaining({ name: 'Avisos' }));
    expect(n.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-1' });
  });

  it('pide permiso si falta y respeta que se niegue', async () => {
    n.getPermissionsAsync.mockResolvedValue({ granted: false } as never);
    n.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);
    expect(await getExpoPushToken()).toBeNull();
    n.requestPermissionsAsync.mockResolvedValue({ granted: true } as never);
    expect(await getExpoPushToken()).toBe('ExponentPushToken[abc]');
  });

  it('en iOS no crea canal y usa el projectId de easConfig', async () => {
    setPlatform('ios');
    constants.expoConfig = null;
    constants.easConfig = { projectId: 'proj-2' };
    await getExpoPushToken();
    expect(n.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(n.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-2' });
  });

  it('devuelve null en web, en Expo Go de Android y sin projectId', async () => {
    setPlatform('web');
    expect(await getExpoPushToken()).toBeNull();
    setPlatform('android');
    constants.executionEnvironment = 'storeClient';
    expect(await getExpoPushToken()).toBeNull();
    constants.executionEnvironment = 'bare';
    constants.expoConfig = { extra: {} };
    expect(await getExpoPushToken()).toBeNull();
    expect(n.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('devuelve null si Expo falla', async () => {
    n.getExpoPushTokenAsync.mockRejectedValue(new Error('sin FCM'));
    expect(await getExpoPushToken()).toBeNull();
  });

  it('el manejador de primer plano muestra el aviso sin sonido', async () => {
    await getExpoPushToken();
    const handler = n.setNotificationHandler.mock.calls[0]?.[0];
    expect(await handler?.handleNotification({} as never)).toMatchObject({ shouldShowBanner: true, shouldPlaySound: false });
  });
});
