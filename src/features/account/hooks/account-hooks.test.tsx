import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as api from '@/features/account/api/account-api';
import { useEditProfile } from '@/features/account/hooks/use-edit-profile';
import { useEmailVerification } from '@/features/account/hooks/use-email-verification';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/account/api/account-api', () => ({ updateProfile: jest.fn(), requestEmailVerification: jest.fn(), verifyContactEmail: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));

const a = jest.mocked(api);
const user = { id: 'u1', fullName: 'Ana Pérez', phone: '+573001234567', mustChangePassword: false, contactEmail: 'ana@correo.com', contactEmailVerified: false };
const session = () => useSessionStore.getState().user;

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.getState().restore({ user, pinEnabled: false, pinOfferPending: false });
});

describe('useEditProfile', () => {
  it('no llama al API si nada cambió', async () => {
    const { result } = await renderHook(() => useEditProfile());
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.notice).toMatch(/No hay cambios/);
    });
    expect(a.updateProfile).not.toHaveBeenCalled();
  });

  it('guarda solo lo cambiado y actualiza la sesión', async () => {
    a.updateProfile.mockResolvedValue({ ok: true, value: { fullName: 'Ana P.', contactEmail: 'ana@correo.com', contactEmailVerified: false } });
    const { result } = await renderHook(() => useEditProfile());
    await act(async () => {
      result.current.fullName.onChangeText('Ana P.');
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cambios guardados.');
    });
    expect(a.updateProfile).toHaveBeenCalledWith({ fullName: 'Ana P.' });
    expect(session()?.fullName).toBe('Ana P.');
  });

  it('muestra errores de validación y de red', async () => {
    const { result } = await renderHook(() => useEditProfile());
    await act(async () => {
      result.current.contactEmail.onChangeText('malo');
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.contactEmail.error).toMatch(/correo válido/);
    });
    await act(async () => {
      result.current.contactEmail.onChangeText('otro@correo.com');
    });
    a.updateProfile.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/Sin conexión/);
    });
    expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
  });
});

describe('useEmailVerification', () => {
  it('solo es visible con correo sin verificar', async () => {
    const { result } = await renderHook(() => useEmailVerification());
    expect(result.current.visible).toBe(true);
    await act(async () => {
      useSessionStore.getState().userUpdated({ ...user, contactEmailVerified: true });
    });
    expect(result.current.visible).toBe(false);
    await act(async () => {
      useSessionStore.getState().userUpdated({ ...user, contactEmail: null });
    });
    expect(result.current.visible).toBe(false);
  });

  it('pide el código y lo verifica', async () => {
    a.requestEmailVerification.mockResolvedValue({ ok: true, value: {} });
    a.verifyContactEmail.mockResolvedValue({ ok: true, value: {} });
    const { result } = await renderHook(() => useEmailVerification());
    await act(async () => {
      result.current.sendCode();
    });
    await waitFor(() => {
      expect(result.current.codeSent).toBe(true);
    });
    expect(result.current.notice).toMatch(/Te enviamos/);
    await act(async () => {
      result.current.setCode('12a345b6');
    });
    expect(result.current.code).toBe('123456');
    await act(async () => {
      result.current.verify();
    });
    await waitFor(() => {
      expect(session()?.contactEmailVerified).toBe(true);
    });
    expect(a.verifyContactEmail).toHaveBeenCalledWith('123456');
  });

  it('rechaza un código incompleto sin llamar al API y explica los fallos', async () => {
    const { result } = await renderHook(() => useEmailVerification());
    await act(async () => {
      result.current.setCode('123');
    });
    await act(async () => {
      result.current.verify();
    });
    expect(result.current.error).toMatch(/no es correcto/);
    expect(a.verifyContactEmail).not.toHaveBeenCalled();
    a.requestEmailVerification.mockResolvedValue({ ok: false, failure: { kind: 'http', status: 409, code: 'CONTACT_EMAIL_ALREADY_VERIFIED', retryAfterSeconds: null } });
    await act(async () => {
      result.current.sendCode();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/ya está verificado/);
    });
  });
});
