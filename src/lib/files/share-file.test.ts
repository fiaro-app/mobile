import * as Sharing from 'expo-sharing';
import { shareFile } from '@/lib/files/share-file';

const mockFile = { exists: false, uri: 'file:///cache/x.pdf', delete: jest.fn(), create: jest.fn(), write: jest.fn() };
jest.mock('expo-file-system', () => ({ File: jest.fn(() => mockFile), Paths: { cache: 'cache' } }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

describe('compartir archivo', () => {
  const sharing = jest.mocked(Sharing);
  beforeEach(() => {
    jest.clearAllMocks();
    mockFile.exists = false;
  });

  it('escribe en la caché y abre la hoja de compartir', async () => {
    sharing.isAvailableAsync.mockResolvedValue(true);
    expect(await shareFile(new Uint8Array([1]), 'x.pdf', 'application/pdf')).toBe('shared');
    expect(mockFile.create).toHaveBeenCalled();
    expect(mockFile.write).toHaveBeenCalledWith(new Uint8Array([1]));
    expect(sharing.shareAsync).toHaveBeenCalledWith('file:///cache/x.pdf', { mimeType: 'application/pdf', dialogTitle: 'x.pdf' });
  });

  it('reemplaza un archivo previo, y avisa si no se puede compartir o fallar', async () => {
    sharing.isAvailableAsync.mockResolvedValue(true);
    mockFile.exists = true;
    await shareFile(new Uint8Array([1]), 'x.pdf', 'application/pdf');
    expect(mockFile.delete).toHaveBeenCalled();
    sharing.isAvailableAsync.mockResolvedValue(false);
    expect(await shareFile(new Uint8Array([1]), 'x.pdf', 'application/pdf')).toBe('unavailable');
    sharing.isAvailableAsync.mockResolvedValue(true);
    sharing.shareAsync.mockRejectedValue(new Error('x'));
    expect(await shareFile(new Uint8Array([1]), 'x.pdf', 'application/pdf')).toBe('failed');
  });
});

