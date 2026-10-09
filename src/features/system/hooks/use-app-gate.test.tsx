import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/system/api/system-api';
import { useAppGate } from '@/features/system/hooks/use-app-gate';

jest.mock('@/features/system/api/system-api', () => ({ fetchMobileVersion: jest.fn() }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }));

const fetchVersion = jest.mocked(api.fetchMobileVersion);
const remote = { minimumSupportedVersion: '1.0.0', latestVersion: '1.1.0', downloadUrl: 'https://fiaro.co/app.apk' };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useAppGate', () => {
  it('empieza comprobando y deja pasar una versión soportada', async () => {
    fetchVersion.mockResolvedValue({ ok: true, value: remote });
    const { result } = await renderHook(() => useAppGate(), { wrapper });
    expect(result.current.status).toBe('checking');
    await waitFor(() => {
      expect(result.current.status).toBe('ok');
    });
    expect(result.current.downloadUrl).toBe(remote.downloadUrl);
  });

  it('bloquea una versión por debajo de la mínima', async () => {
    fetchVersion.mockResolvedValue({ ok: true, value: { ...remote, minimumSupportedVersion: '2.0.0' } });
    const { result } = await renderHook(() => useAppGate(), { wrapper });
    await waitFor(() => {
      expect(result.current.status).toBe('update-required');
    });
  });

  it('reintenta al pedirlo tras un fallo de red', async () => {
    fetchVersion.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useAppGate(), { wrapper });
    await waitFor(() => {
      expect(result.current.status).toBe('offline');
    });
    fetchVersion.mockResolvedValueOnce({ ok: true, value: remote });
    result.current.retry();
    await waitFor(() => {
      expect(result.current.status).toBe('ok');
    });
  });
});
