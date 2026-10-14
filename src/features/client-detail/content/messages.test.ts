import { detailEmptyFor } from '@/features/client-detail/content/messages';

describe('detailEmptyFor', () => {
  it.each([
    ['offline', 'Sin conexión'],
    ['maintenance', 'Estamos en mantenimiento'],
    ['error', 'No pudimos cargar al cliente'],
  ] as const)('%s -> %s', (state, title) => {
    expect(detailEmptyFor(state).title).toBe(title);
  });
});
