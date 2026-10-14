import AsyncStorage from '@react-native-async-storage/async-storage';
import { recallSettlement, rememberSettlement } from '@/features/settlement/store/settlement-memory';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('memoria del cuadre enviado', () => {
  it('recuerda el id por persona y por día', async () => {
    await rememberSettlement('u1', '2026-10-09', 's1');
    expect(await recallSettlement('u1', '2026-10-09')).toBe('s1');
    expect(await recallSettlement('u2', '2026-10-09')).toBeNull();
    expect(await recallSettlement('u1', '2026-10-10')).toBeNull();
  });

  it('devuelve null si el almacenamiento falla', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('boom'));
    expect(await recallSettlement('u1', '2026-10-09')).toBeNull();
  });
});
