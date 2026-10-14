import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { useBootstrap } from '@/features/auth/hooks/use-bootstrap';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import * as gate from '@/features/system/hooks/use-app-gate';

jest.mock('@/features/system/hooks/use-app-gate', () => ({ useAppGate: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ bootSession: jest.fn() }));

const useGate = jest.mocked(gate.useAppGate);
const boot = jest.mocked(actions.bootSession);
const gateState = (status: gate.AppGate['status']): gate.AppGate => ({
  status,
  downloadUrl: null,
  retrying: false,
  retry: jest.fn(),
});

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.getState().signedOut();
  useSessionStore.setState({ ready: false });
});

describe('useBootstrap', () => {
  it('no restaura la sesión mientras la puerta de versión no pasa', async () => {
    useGate.mockReturnValue(gateState('checking'));
    const { result } = await renderHook(() => useBootstrap(), { wrapper });
    expect(boot).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ ready: false, blocked: null });
  });

  it('refleja el bloqueo de la puerta y reintenta la puerta', async () => {
    const blocked = gateState('maintenance');
    useGate.mockReturnValue(blocked);
    const { result } = await renderHook(() => useBootstrap(), { wrapper });
    expect(result.current.blocked).toBe('maintenance');
    result.current.retry();
    expect(blocked.retry).toHaveBeenCalled();
  });

  it('restaura la sesión cuando la puerta pasa y queda lista', async () => {
    useGate.mockReturnValue(gateState('ok'));
    boot.mockImplementation(async () => {
      useSessionStore.getState().signedOut();
      return null;
    });
    const { result } = await renderHook(() => useBootstrap(), { wrapper });
    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });
  });

  it('un fallo de red al restaurar bloquea como "offline"', async () => {
    useGate.mockReturnValue(gateState('ok'));
    boot.mockResolvedValue({ kind: 'offline' });
    const { result } = await renderHook(() => useBootstrap(), { wrapper });
    await waitFor(() => {
      expect(result.current.blocked).toBe('offline');
    });
    expect(result.current.ready).toBe(false);
  });
});
