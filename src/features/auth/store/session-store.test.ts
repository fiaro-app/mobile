import { useSessionStore } from '@/features/auth/store/session-store';

const user = { id: '1', fullName: 'Alejo Pérez', phone: '+573001234567', mustChangePassword: false };
const state = () => useSessionStore.getState();

beforeEach(() => {
  state().signedOut();
  useSessionStore.setState({ ready: false });
});

describe('useSessionStore', () => {
  it('arranca bloqueada cuando hay PIN guardado', () => {
    state().restore({ user, pinEnabled: true, pinOfferPending: false });
    expect(state()).toMatchObject({ ready: true, pinEnabled: true, unlocked: false });
  });

  it('arranca desbloqueada sin PIN', () => {
    state().restore({ user, pinEnabled: false, pinOfferPending: true });
    expect(state()).toMatchObject({ unlocked: true, pinOfferPending: true });
  });

  it('abre desbloqueada al iniciar sesión con contraseña', () => {
    state().signedIn({ user, pinEnabled: true, pinOfferPending: false });
    expect(state().unlocked).toBe(true);
  });

  it('desbloquea, crea el PIN y descarta la oferta', () => {
    state().restore({ user, pinEnabled: true, pinOfferPending: false });
    state().unlock();
    expect(state().unlocked).toBe(true);
    state().restore({ user, pinEnabled: false, pinOfferPending: true });
    state().pinCreated();
    expect(state()).toMatchObject({ pinEnabled: true, pinOfferPending: false });
    state().pinOfferDismissed();
    expect(state().pinOfferPending).toBe(false);
  });

  it('actualiza la persona y la borra al salir', () => {
    state().signedIn({ user, pinEnabled: false, pinOfferPending: false });
    state().userUpdated({ ...user, mustChangePassword: true });
    expect(state().user?.mustChangePassword).toBe(true);
    state().signedOut();
    expect(state()).toMatchObject({ user: null, pinEnabled: false, unlocked: false });
  });
});
