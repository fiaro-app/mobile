import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useInactivityLock } from '@/features/auth/hooks/use-inactivity-lock';
import { LOCK_AFTER_MS, shouldLock } from '@/features/auth/lib/inactivity';
import { useSessionStore } from '@/features/auth/store/session-store';

const user = { id: 'u1', fullName: 'Ana Pérez', phone: '+573001234567', mustChangePassword: false };
type Listener = (state: string) => void;

describe('shouldLock', () => {
  it('pide el PIN solo tras el tiempo límite', () => {
    expect(shouldLock(null, 1_000_000)).toBe(false);
    expect(shouldLock(1_000_000, 1_000_000 + LOCK_AFTER_MS - 1)).toBe(false);
    expect(shouldLock(1_000_000, 1_000_000 + LOCK_AFTER_MS)).toBe(true);
    expect(shouldLock(0, 50, 10)).toBe(true);
  });
});

describe('useInactivityLock', () => {
  let listener: Listener = () => undefined;
  const remove = jest.fn();
  let now = 1_000_000;

  beforeEach(() => {
    jest.restoreAllMocks();
    remove.mockClear();
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
      listener = handler as Listener;
      return { remove } as never;
    });
    useSessionStore.getState().restore({ user, pinEnabled: true, pinOfferPending: false });
    useSessionStore.getState().unlock();
  });

  it('bloquea al volver tras más de un minuto fuera', async () => {
    await renderHook(() => useInactivityLock(true));
    listener('background');
    now += LOCK_AFTER_MS + 1;
    listener('active');
    expect(useSessionStore.getState().unlocked).toBe(false);
  });

  it('no bloquea si vuelve pronto, ni sin salir antes', async () => {
    await renderHook(() => useInactivityLock(true));
    listener('active');
    expect(useSessionStore.getState().unlocked).toBe(true);
    listener('background');
    now += 5_000;
    listener('active');
    expect(useSessionStore.getState().unlocked).toBe(true);
    listener('inactive');
    expect(useSessionStore.getState().unlocked).toBe(true);
  });

  it('sin PIN no bloquea nada', async () => {
    useSessionStore.getState().restore({ user, pinEnabled: false, pinOfferPending: false });
    await renderHook(() => useInactivityLock(true));
    listener('background');
    now += LOCK_AFTER_MS * 5;
    listener('active');
    expect(useSessionStore.getState().unlocked).toBe(true);
  });

  it('inactivo (sin sesión lista) no escucha, y al desmontar deja de escuchar', async () => {
    const spy = jest.mocked(AppState.addEventListener);
    const before = spy.mock.calls.length;
    const idle = await renderHook(() => useInactivityLock(false));
    expect(spy.mock.calls.length).toBe(before);
    await idle.unmount();
    const active = await renderHook(() => useInactivityLock(true));
    await active.unmount();
    expect(remove).toHaveBeenCalled();
  });
});
