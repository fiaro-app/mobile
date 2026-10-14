import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as api from '@/features/auth/api/access-api';
import { accessFailureMessage } from '@/features/auth/content/access-messages';
import { usePasswordRecovery } from '@/features/auth/hooks/use-password-recovery';
import { useRegisterForm } from '@/features/auth/hooks/use-register-form';
import { cleanCode, passwordError, validateAccountStep, validateCompanyStep, validateRecoveryPhone, validateReset } from '@/features/auth/lib/access-forms';

jest.mock('@/features/auth/api/access-api', () => ({ requestPasswordReset: jest.fn(), resetPassword: jest.fn(), registerOwner: jest.fn() }));

const a = jest.mocked(api);
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;
const valid = { fullName: 'Daniel Rojas', nationalId: '1.020.304.050', phone: '300 123 4567', contactEmail: '', password: 'clave-larga-1', businessName: 'Préstamos El Águila' };

beforeEach(() => {
  jest.clearAllMocks();
  a.requestPasswordReset.mockResolvedValue({ ok: true, value: {} });
  a.resetPassword.mockResolvedValue({ ok: true, value: {} });
  a.registerOwner.mockResolvedValue({ ok: true, value: {} });
});

describe('validaciones de acceso', () => {
  it('contraseña, código y celular', () => {
    expect(passwordError('corta')).toBeDefined();
    expect(passwordError('suficientemente-larga')).toBeUndefined();
    expect(passwordError('x'.repeat(129))).toBeDefined();
    expect(cleanCode('12 34a56 78')).toBe('123456');
    expect(validateRecoveryPhone('123')).toHaveProperty('phone');
    expect(validateRecoveryPhone('300 123 4567')).toEqual({});
  });

  it('segundo paso de recuperar', () => {
    expect(Object.keys(validateReset({ code: '', newPassword: 'x', confirmPassword: '' }))).toEqual(['code', 'newPassword', 'confirmPassword']);
    expect(validateReset({ code: '123', newPassword: 'clave-larga', confirmPassword: 'otra-clave-larga' })).toMatchObject({ code: expect.stringMatching(/6 dígitos/) as string, confirmPassword: expect.stringMatching(/no coinciden/) as string });
    expect(validateReset({ code: '123456', newPassword: 'clave-larga', confirmPassword: 'clave-larga' })).toEqual({});
  });

  it('pasos del registro', () => {
    expect(validateAccountStep(valid)).toEqual({});
    expect(Object.keys(validateAccountStep({ ...valid, fullName: 'A', nationalId: '12', phone: '1', contactEmail: 'mal', password: 'x' }))).toEqual(['fullName', 'nationalId', 'phone', 'contactEmail', 'password']);
    expect(validateAccountStep({ ...valid, contactEmail: 'd@correo.com' })).toEqual({});
    expect(validateCompanyStep(valid)).toEqual({});
    expect(validateCompanyStep({ ...valid, businessName: ' ' })).toHaveProperty('businessName');
  });

  it.each([
    [{ kind: 'offline' }, /conectarnos/], [{ kind: 'maintenance' }, /mantenimiento/], [http(400, 'PASSWORD_RESET_CODE_INVALID'), /no es correcto/], [http(400, 'PASSWORD_RESET_CODE_EXPIRED'), /venció/],
    [http(409, 'PHONE_ALREADY_REGISTERED'), /Ya existe una cuenta/], [http(400, 'INVALID_PHONE'), /celular colombiano/], [http(400, 'PASSWORD_TOO_WEAK'), /fácil de adivinar/],
    [http(400, 'INVALID_PASSWORD_LENGTH'), /entre 8 y 128/], [http(429, 'RATE_LIMITED'), /Demasiadas/], [http(429), /Demasiadas/], [http(500), /No pudimos/],
  ] as const)('%j', (failure, expected) => {
    expect(accessFailureMessage('ok' in failure ? failure.failure : failure)).toMatch(expected);
  });
});

describe('usePasswordRecovery', () => {
  it('pide el código, canjea y termina', async () => {
    const { result } = await renderHook(() => usePasswordRecovery());
    await act(async () => {
      result.current.sendCode();
    });
    expect(result.current.errors.phone).toBeDefined();
    await act(async () => {
      result.current.setField('phone', '3001234567');
    });
    expect(result.current.values.phone).toBe('300 123 4567');
    await act(async () => {
      result.current.sendCode();
    });
    await waitFor(() => {
      expect(result.current.step).toBe('reset');
    });
    await act(async () => {
      result.current.submitReset();
    });
    expect(a.resetPassword).not.toHaveBeenCalled();
    await act(async () => {
      result.current.setField('code', '12 34 56');
      result.current.setField('newPassword', 'clave-larga-1');
      result.current.setField('confirmPassword', 'clave-larga-1');
    });
    await act(async () => {
      result.current.submitReset();
    });
    await waitFor(() => {
      expect(result.current.step).toBe('done');
    });
    expect(a.resetPassword).toHaveBeenCalledWith({ phone: '300 123 4567', code: '123456', newPassword: 'clave-larga-1' });
  });

  it('explica el código inválido, reenvía y explica el fallo de red al pedir', async () => {
    const { result } = await renderHook(() => usePasswordRecovery());
    await act(async () => {
      result.current.setField('phone', '3001234567');
    });
    a.requestPasswordReset.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    await act(async () => {
      result.current.sendCode();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/conectarnos/);
    });
    await act(async () => {
      result.current.sendCode();
    });
    await waitFor(() => {
      expect(result.current.step).toBe('reset');
    });
    a.resetPassword.mockResolvedValueOnce(http(400, 'PASSWORD_RESET_CODE_INVALID'));
    await act(async () => {
      result.current.setField('code', '123456');
      result.current.setField('newPassword', 'clave-larga-1');
      result.current.setField('confirmPassword', 'clave-larga-1');
    });
    await act(async () => {
      result.current.submitReset();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/no es correcto/);
    });
    await act(async () => {
      result.current.resend();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Te enviamos un código nuevo.');
    });
  });
});

describe('useRegisterForm', () => {
  const fillAccount = async (result: { current: ReturnType<typeof useRegisterForm> }) => {
    await act(async () => {
      result.current.setField('fullName', valid.fullName);
      result.current.setField('nationalId', valid.nationalId);
      result.current.setField('phone', '3001234567');
      result.current.setField('password', valid.password);
    });
  };

  it('valida el paso 1, avanza, valida el paso 2 y registra', async () => {
    const { result } = await renderHook(() => useRegisterForm());
    await act(async () => {
      result.current.next();
    });
    expect(result.current.step).toBe('account');
    expect(Object.keys(result.current.errors)).toContain('fullName');
    await fillAccount(result);
    await act(async () => {
      result.current.next();
    });
    expect(result.current.step).toBe('company');
    await act(async () => {
      result.current.submit();
    });
    expect(result.current.errors.businessName).toBeDefined();
    await act(async () => {
      result.current.setField('businessName', valid.businessName);
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.step).toBe('done');
    });
    expect(a.registerOwner).toHaveBeenCalledWith(expect.objectContaining({ phone: '300 123 4567', businessName: 'Préstamos El Águila' }));
  });

  it('vuelve al paso 1 si el celular ya existe y deja volver atrás', async () => {
    a.registerOwner.mockResolvedValueOnce(http(409, 'PHONE_ALREADY_REGISTERED'));
    const { result } = await renderHook(() => useRegisterForm());
    await fillAccount(result);
    await act(async () => {
      result.current.next();
      result.current.setField('businessName', valid.businessName);
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.step).toBe('account');
    });
    expect(result.current.formError).toMatch(/Ya existe una cuenta/);
    await act(async () => {
      result.current.next();
    });
    expect(result.current.step).toBe('company');
    a.registerOwner.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/conectarnos/);
    });
    expect(result.current.step).toBe('company');
    await act(async () => {
      result.current.back();
    });
    expect(result.current.step).toBe('account');
  });
});
