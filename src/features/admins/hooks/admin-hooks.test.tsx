import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/admins/api/admins-api';
import { useAdminForm } from '@/features/admins/hooks/use-admin-form';
import { useAdminsScreen } from '@/features/admins/hooks/use-admins-screen';
import * as team from '@/features/team/api/team-api';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import * as share from '@/lib/share-text';

jest.mock('@/features/admins/api/admins-api', () => ({ inviteAdmin: jest.fn(), changeRoles: jest.fn(), deactivateMember: jest.fn() }));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/share-text', () => ({ shareText: jest.fn() }));

const a = jest.mocked(api);
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;
const member = (id: string, name: string, roles: string[], status = 'ACTIVE') => ({ id, userId: `u-${id}`, fullName: name, phone: '+573109998877', roles, status, portfolioId: null });

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  useWorkspaceStore.setState({ membershipId: 'me' });
  jest.mocked(team).fetchMembers.mockResolvedValue({
    ok: true,
    value: [member('owner', 'Marta Ríos', ['OWNER', 'LENDER', 'COLLECTOR']), member('me', 'Lucía Pardo', ['LENDER']), member('both', 'Pedro Gil', ['LENDER', 'COLLECTOR']), member('only', 'Ana Soto', ['LENDER']), member('col', 'Luis Gómez', ['COLLECTOR'])] as never,
  });
  a.changeRoles.mockResolvedValue({ ok: true, value: {} });
  a.deactivateMember.mockResolvedValue({ ok: true, value: {} });
});

describe('useAdminsScreen', () => {
  const ready = async () => {
    const hook = await renderHook(() => useAdminsScreen(), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.rows.length).toBeGreaterThan(0);
    });
    return hook;
  };

  it('lista a los administradores y a quién se le puede subir de rango', async () => {
    const { result } = await ready();
    expect(result.current.rows.map((row) => row.name)).toEqual(['Marta Ríos', 'Lucía Pardo', 'Pedro Gil', 'Ana Soto']);
    expect(result.current.promotable).toEqual([{ value: 'col', label: 'Luis Gómez', roles: ['COLLECTOR'] }]);
  });

  it('sube de rango: suma el rol de administrador a los que ya tenía', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.openSheet();
    });
    expect(result.current.sheetOpen).toBe(true);
    await act(async () => {
      result.current.choosePromotion('col');
    });
    expect(result.current.sheetOpen).toBe(false);
    expect(result.current.pending).toMatchObject({ kind: 'promote', id: 'col' });
    await act(async () => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Luis Gómez ahora es administrador.');
    });
    expect(a.changeRoles).toHaveBeenCalledWith('col', ['COLLECTOR', 'LENDER']);
  });

  it('quita el rol (sigue con el otro) y quita el acceso (solo administraba)', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.chooseAction(result.current.rows[2]!);
    });
    await act(async () => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Pedro Gil ya no es administrador.');
    });
    expect(a.changeRoles).toHaveBeenCalledWith('both', ['COLLECTOR']);

    await act(async () => {
      result.current.chooseAction(result.current.rows[3]!);
    });
    await act(async () => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Ana Soto ya no tiene acceso al negocio.');
    });
    expect(a.deactivateMember).toHaveBeenCalledWith('only');
  });

  it('no actúa sobre el dueño ni sobre uno mismo, y permite cancelar', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.chooseAction(result.current.rows[0]!);
      result.current.chooseAction(result.current.rows[1]!);
    });
    expect(result.current.pending).toBeNull();
    await act(async () => {
      result.current.choosePromotion('desconocido');
    });
    expect(result.current.pending).toBeNull();
    await act(async () => {
      result.current.chooseAction(result.current.rows[2]!);
      result.current.cancel();
    });
    expect(result.current.pending).toBeNull();
    await act(async () => {
      result.current.confirm();
    });
    expect(a.changeRoles).not.toHaveBeenCalled();
  });

  it('explica un fallo y cierra la sesión vencida', async () => {
    a.changeRoles.mockResolvedValueOnce(http(400, 'VALIDATION_FAILED'));
    const { result } = await ready();
    await act(async () => {
      result.current.chooseAction(result.current.rows[2]!);
    });
    await act(async () => {
      result.current.confirm();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/del dueño/);
    });
    expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
  });

  it('distingue la falta de permiso de un fallo de carga, y refresca', async () => {
    jest.mocked(team).fetchMembers.mockResolvedValue(http(403, 'FORBIDDEN'));
    const forbidden = await renderHook(() => useAdminsScreen(), { wrapper });
    await waitFor(() => {
      expect(forbidden.result.current.forbidden).toBe(true);
    });
    expect(forbidden.result.current.failed).toBe(false);
    jest.mocked(team).fetchMembers.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useAdminsScreen(), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.failed).toBe(true);
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});

describe('useAdminForm', () => {
  const fill = async (result: { current: ReturnType<typeof useAdminForm> }) => {
    await act(async () => {
      result.current.fullName.onChangeText('Lucía Pardo');
      result.current.nationalId.onChangeText('1030405060');
      result.current.phone.onChangeText('3109998877');
      result.current.contactEmail.onChangeText('lucia@correo.com');
    });
  };

  it('valida antes de llamar al API', async () => {
    const { result } = await renderHook(() => useAdminForm(), { wrapper });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.fullName.error).toBeTruthy();
    });
    expect(a.inviteAdmin).not.toHaveBeenCalled();
  });

  it('invita y guarda la contraseña temporal para mostrarla y compartirla', async () => {
    a.inviteAdmin.mockResolvedValue({ ok: true, value: { membership: { id: 'm9' }, tempPassword: 'Temp-123' } });
    const { result } = await renderHook(() => useAdminForm(), { wrapper });
    await fill(result);
    expect(result.current.phone.value).toBe('310 999 8877');
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.invited).toMatchObject({ name: 'Lucía Pardo', tempPassword: 'Temp-123' });
    });
    await act(async () => {
      result.current.sharePassword();
    });
    expect(jest.mocked(share).shareText).toHaveBeenCalledWith(expect.stringContaining('Temp-123'));
  });

  it('si la persona ya tenía cuenta no hay contraseña que compartir', async () => {
    a.inviteAdmin.mockResolvedValue({ ok: true, value: { membership: { id: 'm9' }, tempPassword: null } });
    const { result } = await renderHook(() => useAdminForm(), { wrapper });
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.invited).not.toBeNull();
    });
    await act(async () => {
      result.current.sharePassword();
    });
    expect(jest.mocked(share).shareText).not.toHaveBeenCalled();
  });

  it('explica el fallo del API y cierra la sesión vencida', async () => {
    a.inviteAdmin.mockResolvedValue(http(409, 'CONFLICT'));
    const { result } = await renderHook(() => useAdminForm(), { wrapper });
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/ya trabaja/);
    });
    expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    expect(result.current.invited).toBeNull();
  });
});
