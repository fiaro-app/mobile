import { renderHook } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAccess } from '@/features/auth/store/session-store';
import { homeOf, useGoBack } from '@/features/workspace/hooks/use-go-back';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/auth/store/session-store', () => ({ useAccess: jest.fn() }));

const router = { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRouter).mockReturnValue(router as never);
  jest.mocked(useAccess).mockReturnValue('signed-in');
  useWorkspaceStore.setState({ mode: 'admin' });
});

describe('useGoBack', () => {
  it('vuelve a la pantalla anterior si la hay', async () => {
    router.canGoBack.mockReturnValue(true);
    (await renderHook(() => useGoBack())).result.current();
    expect(router.back).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('sin pantalla anterior lleva al inicio del modo', async () => {
    router.canGoBack.mockReturnValue(false);
    (await renderHook(() => useGoBack())).result.current();
    expect(router.replace).toHaveBeenCalledWith('/admin');
    useWorkspaceStore.setState({ mode: 'collector' });
    (await renderHook(() => useGoBack())).result.current();
    expect(router.replace).toHaveBeenLastCalledWith('/');
  });

  it('sin sesión lleva al login', async () => {
    router.canGoBack.mockReturnValue(false);
    jest.mocked(useAccess).mockReturnValue('signed-out');
    (await renderHook(() => useGoBack())).result.current();
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('homeOf da el inicio de cada modo', () => {
    expect(homeOf('admin')).toBe('/admin');
    expect(homeOf('collector')).toBe('/');
  });
});
