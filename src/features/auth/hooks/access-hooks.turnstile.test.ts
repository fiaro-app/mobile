import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as api from '@/features/auth/api/access-api';
import { accessFailureMessage, TURNSTILE_LOAD_ERROR, TURNSTILE_PENDING } from '@/features/auth/content/access-messages';
import { usePasswordRecovery } from '@/features/auth/hooks/use-password-recovery';
import { useRegisterForm } from '@/features/auth/hooks/use-register-form';

jest.mock('@/lib/config', () => ({ ...jest.requireActual<object>('@/lib/config'), TURNSTILE_SITE_KEY: '1x00000000000000000000AA' }));
jest.mock('@/features/auth/api/access-api', () => ({ requestPasswordReset: jest.fn(), resetPassword: jest.fn(), registerOwner: jest.fn() }));

const a = jest.mocked(api);
const valid = { fullName: 'Daniel Rojas', nationalId: '1020304050', phone: '3001234567', contactEmail: '', password: 'clave-larga-1', businessName: 'Préstamos El Águila' };

beforeEach(() => {
  jest.clearAllMocks();
  a.requestPasswordReset.mockResolvedValue({ ok: true, value: {} });
  a.registerOwner.mockResolvedValue({ ok: true, value: {} });
});

describe('con Turnstile activo', () => {
  it('explica TURNSTILE_FAILED', () => {
    expect(accessFailureMessage({ kind: 'http', status: 400, code: 'TURNSTILE_FAILED', retryAfterSeconds: null })).toMatch(/verificar que eres una persona/);
  });

  it('recuperar: exige el token, lo envía y pide uno nuevo para reenviar', async () => {
    const { result } = await renderHook(() => usePasswordRecovery());
    await act(async () => {
      result.current.setField('phone', '3001234567');
    });
    await act(async () => {
      result.current.sendCode();
    });
    expect(result.current.formError).toBe(TURNSTILE_PENDING);
    expect(a.requestPasswordReset).not.toHaveBeenCalled();

    const before = result.current.turnstileResetKey;
    await act(async () => {
      result.current.setTurnstileToken('tok');
    });
    await act(async () => {
      result.current.sendCode();
    });
    await waitFor(() => {
      expect(result.current.step).toBe('reset');
    });
    expect(a.requestPasswordReset).toHaveBeenCalledWith('300 123 4567', 'tok');
    expect(result.current.turnstileResetKey).toBe(before + 1);

    await act(async () => {
      result.current.resend();
    });
    expect(result.current.formError).toBe(TURNSTILE_PENDING);
    await act(async () => {
      result.current.turnstileError();
    });
    expect(result.current.formError).toBe(TURNSTILE_LOAD_ERROR);
  });

  it('registro: exige el token, lo envía y pide uno nuevo si el API lo rechaza', async () => {
    const { result } = await renderHook(() => useRegisterForm());
    await act(async () => {
      for (const [field, value] of Object.entries(valid)) result.current.setField(field as keyof typeof valid, value);
    });
    await act(async () => {
      result.current.next();
    });
    await act(async () => {
      result.current.submit();
    });
    expect(result.current.formError).toBe(TURNSTILE_PENDING);
    expect(a.registerOwner).not.toHaveBeenCalled();

    a.registerOwner.mockResolvedValueOnce({ ok: false, failure: { kind: 'http', status: 400, code: 'TURNSTILE_FAILED', retryAfterSeconds: null } });
    const before = result.current.turnstileResetKey;
    await act(async () => {
      result.current.setTurnstileToken('tok');
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/verificar que eres una persona/);
    });
    expect(a.registerOwner).toHaveBeenCalledWith(expect.objectContaining({ turnstileToken: 'tok' }));
    expect(result.current.turnstileResetKey).toBe(before + 1);
    await act(async () => {
      result.current.turnstileError();
    });
    expect(result.current.formError).toBe(TURNSTILE_LOAD_ERROR);
  });
});
