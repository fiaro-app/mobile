import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/workspace/api/workspace-api';
import { ROLES_PATIENCE_MS, useWorkspace } from '@/features/workspace/hooks/use-workspace';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import * as brand from '@/lib/theme/brand';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/features/workspace/api/workspace-api', () => ({ fetchOwnMembership: jest.fn(), fetchLender: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/theme/brand', () => ({ applyBrandColor: jest.fn() }));

const a = jest.mocked(api);
const store = () => useWorkspaceStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  store().reset();
  a.fetchLender.mockResolvedValue({ ok: true, value: { id: 'l', name: 'X', brandColor: '#112233' } });
});

describe('useWorkspace', () => {
  it('no hace nada sin sesión', async () => {
    await renderHook(() => useWorkspace(null));
    expect(store().status).toBe('idle');
    expect(a.fetchOwnMembership).not.toHaveBeenCalled();
  });

  it('carga los roles, elige el modo, guarda el caché y aplica el color de marca', async () => {
    a.fetchOwnMembership.mockResolvedValue({ ok: true, value: { id: 'm-own', roles: ['OWNER', 'COLLECTOR'] } });
    await renderHook(() => useWorkspace('u1'));
    await waitFor(() => {
      expect(store().status).toBe('ready');
    });
    expect(store()).toMatchObject({ roles: ['OWNER', 'COLLECTOR'], membershipId: 'm-own', mode: 'admin' });
    expect(await AsyncStorage.getItem('fiaro.roles.u1')).toBe('["OWNER","COLLECTOR"]');
    await waitFor(() => {
      expect(brand.applyBrandColor).toHaveBeenCalledWith('#112233');
    });
  });

  it('sin roles conocidos entra como cobrador', async () => {
    a.fetchOwnMembership.mockResolvedValue({ ok: true, value: { id: 'm-own', roles: [] } });
    await renderHook(() => useWorkspace('u1'));
    await waitFor(() => {
      expect(store().status).toBe('ready');
    });
    expect(store().mode).toBe('collector');
  });

  it('sin conexión usa los últimos roles guardados', async () => {
    await AsyncStorage.setItem('fiaro.roles.u1', '["LENDER"]');
    a.fetchOwnMembership.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    await renderHook(() => useWorkspace('u1'));
    await waitFor(() => {
      expect(store().status).toBe('ready');
    });
    expect(store()).toMatchObject({ roles: ['LENDER'], mode: 'admin' });
    expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
  });

  it('sin conexión y sin caché (o con caché dañado) entra como cobrador', async () => {
    await AsyncStorage.setItem('fiaro.roles.u1', 'no-es-json');
    a.fetchOwnMembership.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    await renderHook(() => useWorkspace('u1'));
    await waitFor(() => {
      expect(store().status).toBe('ready');
    });
    expect(store()).toMatchObject({ roles: ['COLLECTOR'], mode: 'collector' });
  });

  it('si los roles tardan abre con los guardados y aplica la respuesta cuando llega', async () => {
    jest.useFakeTimers();
    await AsyncStorage.setItem('fiaro.roles.u1', '["COLLECTOR"]');
    let resolveRoles: (value: Awaited<ReturnType<typeof api.fetchOwnMembership>>) => void = () => undefined;
    a.fetchOwnMembership.mockReturnValue(new Promise((resolve) => { resolveRoles = resolve; }));
    await renderHook(() => useWorkspace('u1'));
    await act(async () => {
      jest.advanceTimersByTime(ROLES_PATIENCE_MS + 10);
    });
    jest.useRealTimers();
    await waitFor(() => {
      expect(store()).toMatchObject({ status: 'ready', roles: ['COLLECTOR'], mode: 'collector' });
    });
    await act(async () => {
      resolveRoles({ ok: true, value: { id: 'm-own', roles: ['OWNER'] } });
    });
    await waitFor(() => {
      expect(store()).toMatchObject({ roles: ['OWNER'], mode: 'admin' });
    });
  });

  it('al perder la sesión reinicia el estado', async () => {
    a.fetchOwnMembership.mockResolvedValue({ ok: true, value: { id: 'm-own', roles: ['OWNER'] } });
    const hook = await renderHook(({ id }: { id: string | null }) => useWorkspace(id), { initialProps: { id: 'u1' as string | null } });
    await waitFor(() => {
      expect(store().status).toBe('ready');
    });
    await hook.rerender({ id: null });
    expect(store().status).toBe('idle');
  });
});
