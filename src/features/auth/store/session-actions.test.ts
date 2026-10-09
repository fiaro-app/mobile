import * as authApi from '@/features/auth/api/auth-api';
import * as pinVault from '@/features/auth/api/pin-vault';
import { bootSession, completePinExhausted, completeSignIn, completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/auth/api/auth-api', () => ({ restoreSession: jest.fn(), signOut: jest.fn() }));
jest.mock('@/features/auth/api/pin-vault', () => ({
  hasPin: jest.fn(),
  isPinDeclined: jest.fn(),
  clearPin: jest.fn(),
  resetPinDeclined: jest.fn(),
}));
jest.mock('@/lib/theme/brand', () => ({ resetBrandColor: jest.fn() }));

const api = jest.mocked(authApi);
const vault = jest.mocked(pinVault);
const user = { id: '1', fullName: 'Alejo Pérez', phone: '+573001234567', mustChangePassword: false };
const state = () => useSessionStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  state().signedOut();
  useSessionStore.setState({ ready: false });
  vault.hasPin.mockResolvedValue(false);
  vault.isPinDeclined.mockResolvedValue(false);
  api.signOut.mockResolvedValue();
});

describe('bootSession', () => {
  it('devuelve el fallo de red sin tocar el estado', async () => {
    api.restoreSession.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    expect(await bootSession()).toEqual({ kind: 'offline' });
    expect(state().ready).toBe(false);
  });

  it('sin sesión vigente borra el PIN y va al login', async () => {
    api.restoreSession.mockResolvedValue({ ok: true, value: null });
    expect(await bootSession()).toBeNull();
    expect(vault.clearPin).toHaveBeenCalled();
    expect(state()).toMatchObject({ ready: true, user: null });
  });

  it('con sesión y PIN arranca bloqueada', async () => {
    api.restoreSession.mockResolvedValue({ ok: true, value: user });
    vault.hasPin.mockResolvedValue(true);
    await bootSession();
    expect(state()).toMatchObject({ user, pinEnabled: true, unlocked: false, pinOfferPending: false });
  });

  it('con sesión y sin PIN lo ofrece, salvo que lo haya rechazado', async () => {
    api.restoreSession.mockResolvedValue({ ok: true, value: user });
    await bootSession();
    expect(state().pinOfferPending).toBe(true);
    state().signedOut();
    vault.isPinDeclined.mockResolvedValue(true);
    await bootSession();
    expect(state().pinOfferPending).toBe(false);
  });
});

describe('completeSignIn', () => {
  it('abre la sesión desbloqueada y ofrece el PIN', async () => {
    await completeSignIn(user);
    expect(state()).toMatchObject({ user, unlocked: true, pinOfferPending: true });
  });
});

describe('completeSignOut', () => {
  it('cierra en el servidor, borra el PIN y la decisión de rechazarlo', async () => {
    await completeSignIn(user);
    await completeSignOut();
    expect(api.signOut).toHaveBeenCalled();
    expect(vault.clearPin).toHaveBeenCalled();
    expect(vault.resetPinDeclined).toHaveBeenCalled();
    expect(state().user).toBeNull();
  });
});

describe('completePinExhausted', () => {
  it('vuelve al login sin esperar al servidor', async () => {
    await completeSignIn(user);
    await completePinExhausted();
    expect(state().user).toBeNull();
    expect(vault.resetPinDeclined).toHaveBeenCalled();
  });
});
