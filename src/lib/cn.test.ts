import { cn } from '@/lib/cn';

describe('cn', () => {
  it('une las clases presentes y descarta las vacías', () => {
    expect(cn('px-4', false, null, undefined, 'py-2')).toBe('px-4 py-2');
  });

  it('devuelve cadena vacía sin clases', () => {
    expect(cn()).toBe('');
  });
});
