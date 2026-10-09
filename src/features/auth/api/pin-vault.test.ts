import { clearPin, declinePin, hasPin, isPinDeclined, savePin, verifyPin } from '@/features/auth/api/pin-vault';

const mockMemory = new Map<string, string>();

jest.mock('@/lib/storage/secure-storage', () => ({
  secureStorage: {
    getItemAsync: (key: string) => Promise.resolve(mockMemory.get(key) ?? null),
    setItemAsync: (key: string, value: string) => {
      mockMemory.set(key, value);
      return Promise.resolve();
    },
    deleteItemAsync: (key: string) => {
      mockMemory.delete(key);
      return Promise.resolve();
    },
  },
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  randomUUID: () => `salt-${String(Math.random())}`,
  digestStringAsync: (_algorithm: string, value: string) =>
    Promise.resolve(`digest(${[...value].reverse().join('')})`),
}));

beforeEach(() => {
  mockMemory.clear();
});

describe('pin-vault', () => {
  it('no guarda el PIN en claro', async () => {
    await savePin('4821');
    expect([...mockMemory.values()]).not.toContain('4821');
    expect(await hasPin()).toBe(true);
  });

  it('acepta el PIN correcto y reinicia el contador', async () => {
    await savePin('4821');
    expect(await verifyPin('0000')).toBe('wrong');
    expect(await verifyPin('4821')).toBe('ok');
    expect(mockMemory.get('fiaro.pin.attempts')).toBe('0');
  });

  it('borra el PIN al agotar los intentos', async () => {
    await savePin('4821');
    const results = [];
    for (let index = 0; index < 5; index += 1) results.push(await verifyPin('0000'));
    expect(results).toEqual(['wrong', 'wrong', 'wrong', 'wrong', 'exhausted']);
    expect(await hasPin()).toBe(false);
    expect(await verifyPin('4821')).toBe('exhausted');
  });

  it('recuerda que se rechazó crear PIN, y guardar uno lo olvida', async () => {
    await declinePin();
    expect(await isPinDeclined()).toBe(true);
    await savePin('4821');
    expect(await isPinDeclined()).toBe(false);
    await clearPin();
    expect(await hasPin()).toBe(false);
  });
});
