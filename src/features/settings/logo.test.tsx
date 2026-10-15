import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as collectorsApi from '@/features/collectors/api/collectors-api';
import * as api from '@/features/settings/api/settings-api';
import { useSettingsScreen } from '@/features/settings/hooks/use-settings-screen';

jest.mock('@/features/settings/api/settings-api', () => ({
  fetchLenderSettings: jest.fn(), patchLender: jest.fn(), requestLogoUploadUrl: jest.fn(), readImageBlob: jest.fn(), uploadToStorage: jest.fn(), fetchSubscription: jest.fn(),
}));
jest.mock('@/features/collectors/api/collectors-api', () => ({ fetchPortfolios: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/files/pick-image', () => ({ pickImage: jest.fn() }));
jest.mock('@/lib/theme/brand', () => ({ applyBrandColor: jest.fn(), DEFAULT_BRAND_COLOR: '#3B3382' }));

const a = jest.mocked(api);
const settings = (over = {}) => ({ id: 'l1', name: 'El Águila', logoUrl: null, brandColor: null, nonWorkingWeekdays: ['SUNDAY' as const], skipNationalHolidays: false, ...over });
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  a.fetchLenderSettings.mockResolvedValue({ ok: true, value: settings() });
  a.fetchSubscription.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
  jest.mocked(collectorsApi).fetchPortfolios.mockResolvedValue({ ok: true, value: [] });
  a.patchLender.mockImplementation((patch) => Promise.resolve({ ok: true, value: settings(patch) }));
});

describe('logo', () => {
  const pick = jest.requireMock<{ pickImage: jest.Mock }>('@/lib/files/pick-image');

  const BLOB = { size: 1000 } as Blob;

  beforeEach(() => {
    pick.pickImage.mockReset();
    a.readImageBlob.mockResolvedValue(BLOB);
  });

  const ready = async () => {
    const hook = await renderHook(() => useSettingsScreen(), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.loading).toBe(false);
    });
    return hook;
  };

  it('sube el logo: URL firmada, almacenamiento y guardado', async () => {
    pick.pickImage.mockResolvedValue({ uri: 'file:///logo.png', mimeType: 'image/png', size: 1000 });
    a.requestLogoUploadUrl.mockResolvedValue({ ok: true, value: { uploadUrl: 'https://storage/put', publicUrl: 'https://cdn/logo.png' } });
    a.uploadToStorage.mockResolvedValue(true);
    const { result } = await ready();
    await act(async () => {
      result.current.logo.choose();
    });
    await waitFor(() => {
      expect(result.current.logo.notice).toBe('Logo actualizado.');
    });
    expect(a.requestLogoUploadUrl).toHaveBeenCalledWith('image/png', 1000);
    expect(a.uploadToStorage).toHaveBeenCalledWith('https://storage/put', BLOB, 'image/png');
    expect(a.patchLender).toHaveBeenCalledWith({ logoUrl: 'https://cdn/logo.png' });
  });

  it('rechaza una imagen que no sirve y no hace nada si se cancela', async () => {
    pick.pickImage.mockResolvedValueOnce({ uri: 'file:///x.gif', mimeType: 'image/gif', size: 10 });
    const { result } = await ready();
    await act(async () => {
      result.current.logo.choose();
    });
    await waitFor(() => {
      expect(result.current.logo.error).toMatch(/PNG o JPG/);
    });
    pick.pickImage.mockResolvedValueOnce(null);
    await act(async () => {
      result.current.logo.choose();
    });
    expect(a.requestLogoUploadUrl).not.toHaveBeenCalled();
  });

  it('firma el peso real de la imagen leída, y no sube nada si pesa más de 2 MB o no se puede leer', async () => {
    pick.pickImage.mockResolvedValue({ uri: 'file:///logo.png', mimeType: 'image/png', size: 0 });
    a.readImageBlob.mockResolvedValueOnce({ size: 3 * 1024 * 1024 } as Blob);
    const { result } = await ready();
    await act(async () => {
      result.current.logo.choose();
    });
    await waitFor(() => {
      expect(result.current.logo.error).toMatch(/2 MB/);
    });
    a.readImageBlob.mockResolvedValueOnce(null);
    await act(async () => {
      result.current.logo.choose();
    });
    await waitFor(() => {
      expect(result.current.logo.error).toMatch(/No pudimos leer/);
    });
    expect(a.requestLogoUploadUrl).not.toHaveBeenCalled();
  });

  it('explica un fallo del almacenamiento y uno de la URL firmada', async () => {
    pick.pickImage.mockResolvedValue({ uri: 'file:///logo.png', mimeType: 'image/png', size: 1000 });
    a.requestLogoUploadUrl.mockResolvedValue({ ok: true, value: { uploadUrl: 'https://storage/put', publicUrl: 'https://cdn/logo.png' } });
    a.uploadToStorage.mockResolvedValue(false);
    const { result } = await ready();
    await act(async () => {
      result.current.logo.choose();
    });
    await waitFor(() => {
      expect(result.current.logo.error).toMatch(/No pudimos subir el logo/);
    });
    a.requestLogoUploadUrl.mockResolvedValue(http(403, 'FORBIDDEN'));
    await act(async () => {
      result.current.logo.choose();
    });
    await waitFor(() => {
      expect(a.patchLender).not.toHaveBeenCalled();
    });
  });

  it('quita el logo con confirmación', async () => {
    a.fetchLenderSettings.mockResolvedValue({ ok: true, value: settings({ logoUrl: 'https://cdn/logo.png' }) });
    const { result } = await ready();
    expect(result.current.logo.logoUrl).toBe('https://cdn/logo.png');
    await act(async () => {
      result.current.logo.askRemove();
    });
    expect(result.current.logo.confirmingRemove).toBe(true);
    await act(async () => {
      result.current.logo.cancelRemove();
    });
    await act(async () => {
      result.current.logo.askRemove();
    });
    await act(async () => {
      result.current.logo.confirmRemove();
    });
    await waitFor(() => {
      expect(result.current.logo.notice).toBe('Logo quitado.');
    });
    expect(a.patchLender).toHaveBeenCalledWith({ logoUrl: null });
  });
});
