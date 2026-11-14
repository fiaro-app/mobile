import { renderHook } from '@testing-library/react-native';
import * as editProfile from '@/features/account/hooks/use-edit-profile';
import * as emailVerification from '@/features/account/hooks/use-email-verification';
import { useProfileEditor } from '@/features/account/hooks/use-profile-editor';

jest.mock('@/features/account/hooks/use-edit-profile', () => ({ useEditProfile: jest.fn() }));
jest.mock('@/features/account/hooks/use-email-verification', () => ({ useEmailVerification: jest.fn() }));

const field = { value: '', error: null, onChangeText: jest.fn(), onBlur: jest.fn() };
const submit = jest.fn();
const verification = { visible: true, codeSent: false, code: '', busy: false, error: null, notice: null, setCode: jest.fn(), sendCode: jest.fn(), verify: jest.fn() };

function mock(visible: boolean, codeSent = false) {
  jest.mocked(editProfile.useEditProfile).mockReturnValue({ fullName: field, contactEmail: field, submitting: false, formError: null, notice: null, submit });
  jest.mocked(emailVerification.useEmailVerification).mockReturnValue({ ...verification, visible, codeSent });
}

describe('useProfileEditor', () => {
  it('junta el formulario de perfil y su guardado', async () => {
    mock(false);
    const { result } = await renderHook(() => useProfileEditor());
    expect(result.current.onSubmit).toBe(submit);
    expect(result.current.fullName).toBe(field);
    expect(result.current.verification).toBeNull();
  });

  it('muestra la verificación del correo cuando aplica, con «Enviar» o «Reenviar» según el estado', async () => {
    mock(true);
    const first = await renderHook(() => useProfileEditor());
    expect(first.result.current.verification?.sendLabel).toBe('Enviar código');
    mock(true, true);
    const second = await renderHook(() => useProfileEditor());
    expect(second.result.current.verification?.sendLabel).toBe('Reenviar código');
    expect(second.result.current.verification?.onVerify).toBe(verification.verify);
  });
});
