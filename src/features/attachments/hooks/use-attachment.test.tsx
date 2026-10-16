import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as api from '@/features/attachments/api/attachments-api';
import { useAttachment } from '@/features/attachments/hooks/use-attachment';
import * as settingsApi from '@/features/settings/api/settings-api';

jest.mock('@/features/attachments/api/attachments-api', () => ({ fetchAttachmentUrl: jest.fn(), requestAttachmentUploadUrl: jest.fn(), saveAttachment: jest.fn(), deleteAttachment: jest.fn() }));
jest.mock('@/features/settings/api/settings-api', () => ({ readImageBlob: jest.fn(), uploadToStorage: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/files/pick-image', () => ({ pickImage: jest.fn() }));

const a = jest.mocked(api);
const s = jest.mocked(settingsApi);
const pick = jest.requireMock<{ pickImage: jest.Mock }>('@/lib/files/pick-image');

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const ready = async () => {
  const hook = await renderHook(() => useAttachment('client', 'c1'), { wrapper });
  await waitFor(() => {
    expect(hook.result.current.loading).toBe(false);
  });
  return hook;
};

beforeEach(() => {
  jest.resetAllMocks();
  a.fetchAttachmentUrl.mockResolvedValue({ ok: true, value: null });
});

describe('useAttachment', () => {
  it('loads the signed url', async () => {
    a.fetchAttachmentUrl.mockResolvedValue({ ok: true, value: 'https://s/x' });
    const { result } = await ready();
    expect(result.current.url).toBe('https://s/x');
  });

  it('flags a load failure', async () => {
    a.fetchAttachmentUrl.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const { result } = await renderHook(() => useAttachment('client', 'c1'), { wrapper });
    await waitFor(() => {
      expect(result.current.loadFailed).toBe(true);
    });
  });

  it('rejects a picture that is not png or jpg without calling the api', async () => {
    pick.pickImage.mockResolvedValue({ uri: 'file:///a.gif', mimeType: 'image/gif', size: 10 });
    const { result } = await ready();
    await act(async () => {
      result.current.choose();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/PNG o JPG/);
    });
    expect(a.requestAttachmentUploadUrl).not.toHaveBeenCalled();
  });

  it('uploads: signed url, storage and save', async () => {
    pick.pickImage.mockResolvedValue({ uri: 'file:///a.png', mimeType: 'image/png', size: 1000 });
    s.readImageBlob.mockResolvedValue({ size: 1000 } as Blob);
    a.requestAttachmentUploadUrl.mockResolvedValue({ ok: true, value: { uploadUrl: 'https://s/put', key: 'k' } });
    s.uploadToStorage.mockResolvedValue(true);
    a.saveAttachment.mockResolvedValue({ ok: true, value: null });
    const { result } = await ready();
    await act(async () => {
      result.current.choose();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Imagen guardada.');
    });
    expect(a.saveAttachment).toHaveBeenCalledWith('client', 'c1', 'k');
  });

  it('reports a storage failure with its own message and does not save', async () => {
    pick.pickImage.mockResolvedValue({ uri: 'file:///a.png', mimeType: 'image/png', size: 1000 });
    s.readImageBlob.mockResolvedValue({ size: 1000 } as Blob);
    a.requestAttachmentUploadUrl.mockResolvedValue({ ok: true, value: { uploadUrl: 'https://s/put', key: 'k' } });
    s.uploadToStorage.mockResolvedValue(false);
    const { result } = await ready();
    await act(async () => {
      result.current.choose();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/No pudimos subir/);
    });
    expect(a.saveAttachment).not.toHaveBeenCalled();
  });

  it('asks before removing, then removes', async () => {
    a.fetchAttachmentUrl.mockResolvedValue({ ok: true, value: 'https://s/x' });
    a.deleteAttachment.mockResolvedValue({ ok: true, value: null });
    const { result } = await ready();
    await act(async () => {
      result.current.askRemove();
    });
    expect(result.current.confirmingRemove).toBe(true);
    await act(async () => {
      result.current.confirmRemove();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Imagen quitada.');
    });
    expect(result.current.confirmingRemove).toBe(false);
  });
});
