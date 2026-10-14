import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import * as lenderApi from '@/features/lender-stats/api/lender-stats-api';
import { useStatsExport } from '@/features/lender-stats/hooks/use-stats-export';
import { logoContentType, validateLogo } from '@/features/settings/lib/logo-file';
import { authedDownload, filenameFrom } from '@/lib/files/download';
import { pickImage } from '@/lib/files/pick-image';
import { shareFile } from '@/lib/files/share-file';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/features/auth/api/auth-client', () => ({ authClient: { getCookie: () => 'fiaro.session_token=abc' } }));
jest.mock('@/features/lender-stats/api/lender-stats-api', () => ({ exportStatsPdf: jest.fn(), DEFAULT_STATS_FILENAME: 'estadisticas.pdf' }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/files/share-file', () => ({ shareFile: jest.fn() }));

describe('descarga autenticada', () => {
  it('lee el nombre del Content-Disposition', () => {
    expect(filenameFrom('attachment; filename="estadisticas-oct.pdf"')).toBe('estadisticas-oct.pdf');
    expect(filenameFrom("attachment; filename*=UTF-8''informe%20mes.pdf")).toBe('informe mes.pdf');
    expect(filenameFrom(null)).toBeNull();
    expect(filenameFrom('inline')).toBeNull();
  });

  it('devuelve bytes y nombre, con la cookie de sesión', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-disposition': 'attachment; filename="a.pdf"' } }));
    const result = await authedDownload('/x', { method: 'QUERY', body: { a: 1 } });
    expect(result).toEqual({ ok: true, value: { bytes: new Uint8Array([1, 2, 3]), filename: 'a.pdf' } });
    const init = (globalThis.fetch as jest.Mock).mock.calls[0]?.[1] as RequestInit & { headers: Record<string, string> };
    expect(init).toMatchObject({ method: 'QUERY', body: '{"a":1}' });
    expect(init.headers).toMatchObject({ cookie: 'fiaro.session_token=abc', 'content-type': 'application/json' });
  });

  it('clasifica los fallos y la falta de red', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response('no', { status: 403 }));
    expect(await authedDownload('/x')).toMatchObject({ ok: false, failure: { kind: 'http', status: 403 } });
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('red'));
    expect(await authedDownload('/x')).toEqual({ ok: false, failure: { kind: 'offline' } });
  });
});

describe('elegir imagen y logo', () => {
  const picker = jest.mocked(ImagePicker);

  it('devuelve la imagen elegida o null si se cancela o falla', async () => {
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///a.png', mimeType: 'image/png', fileSize: 1000 }] } as never);
    expect(await pickImage()).toEqual({ uri: 'file:///a.png', mimeType: 'image/png', size: 1000 });
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///b' }] } as never);
    expect(await pickImage()).toEqual({ uri: 'file:///b', mimeType: 'image/jpeg', size: 0 });
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);
    expect(await pickImage()).toBeNull();
    picker.launchImageLibraryAsync.mockRejectedValue(new Error('permiso'));
    expect(await pickImage()).toBeNull();
  });

  it('valida el logo', () => {
    expect(validateLogo({ mimeType: 'image/png', size: 100 })).toBeNull();
    expect(validateLogo({ mimeType: 'image/jpg', size: 0 })).toBeNull();
    expect(validateLogo({ mimeType: 'image/gif', size: 100 })).toMatch(/PNG o JPG/);
    expect(validateLogo({ mimeType: 'image/png', size: 3 * 1024 * 1024 })).toMatch(/2 MB/);
    expect(logoContentType('image/png')).toBe('image/png');
    expect(logoContentType('image/jpg')).toBe('image/jpeg');
  });
});

describe('useStatsExport', () => {
  const api = jest.mocked(lenderApi);
  const share = jest.mocked(shareFile);
  const range = { from: '2026-10-01', to: '2026-10-09' };

  it('descarga y comparte el PDF', async () => {
    api.exportStatsPdf.mockResolvedValue({ ok: true, value: { bytes: new Uint8Array([1]), filename: 'e.pdf' } });
    share.mockResolvedValue('shared');
    const { result } = await renderHook(() => useStatsExport(range, 'm1'));
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(new Uint8Array([1]), 'e.pdf', 'application/pdf');
    });
    expect(api.exportStatsPdf).toHaveBeenCalledWith(range, 'm1', undefined);
    expect(result.current.error).toBeNull();
  });

  it('usa el nombre por defecto y explica los fallos', async () => {
    api.exportStatsPdf.mockResolvedValueOnce({ ok: true, value: { bytes: new Uint8Array([1]), filename: null } });
    share.mockResolvedValueOnce('unavailable');
    const { result } = await renderHook(() => useStatsExport(range, ''));
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/no puede compartir/);
    });
    expect(share).toHaveBeenLastCalledWith(expect.anything(), 'estadisticas.pdf', 'application/pdf');
    expect(api.exportStatsPdf).toHaveBeenLastCalledWith(range, undefined, undefined);
    api.exportStatsPdf.mockResolvedValueOnce({ ok: true, value: { bytes: new Uint8Array([1]), filename: 'e.pdf' } });
    share.mockResolvedValueOnce('failed');
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/guardar el PDF/);
    });
    api.exportStatsPdf.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/Sin conexión/);
    });
    api.exportStatsPdf.mockResolvedValueOnce({ ok: false, failure: { kind: 'http', status: 500, code: null, retryAfterSeconds: null } });
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/generar el PDF/);
    });
  });
});
