import { IMAGE_MAX_BYTES, imageContentType, validateImage } from '@/features/attachments/lib/image-file';

describe('validateImage', () => {
  it('accepts png, jpeg and jpg within the limit, and an unknown size', () => {
    expect(validateImage({ mimeType: 'image/png', size: 10 })).toBeNull();
    expect(validateImage({ mimeType: 'image/jpg', size: IMAGE_MAX_BYTES })).toBeNull();
    expect(validateImage({ mimeType: 'image/jpeg', size: 0 })).toBeNull();
  });
  it('rejects other types and big files', () => {
    expect(validateImage({ mimeType: 'image/gif', size: 10 })).toMatch(/PNG o JPG/);
    expect(validateImage({ mimeType: 'image/png', size: IMAGE_MAX_BYTES + 1 })).toMatch(/5 MB/);
  });
  it('normalizes the content type', () => {
    expect(imageContentType('image/png')).toBe('image/png');
    expect(imageContentType('image/jpg')).toBe('image/jpeg');
  });
});
