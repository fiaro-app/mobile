import { syncBannerMessage } from '@/features/visit/content/sync-message';

describe('syncBannerMessage', () => {
  it('no avisa si no hay nada', () => {
    expect(syncBannerMessage(0, 0)).toBeNull();
  });

  it('concuerda singular y plural', () => {
    expect(syncBannerMessage(1, 0)).toBe('1 visita pendiente de sincronizar');
    expect(syncBannerMessage(2, 0)).toBe('2 visitas pendientes de sincronizar');
  });

  it('avisa de las rechazadas por separado', () => {
    expect(syncBannerMessage(0, 1)).toBe('1 visita rechazada por el servidor');
    expect(syncBannerMessage(2, 3)).toBe('2 visitas pendientes de sincronizar · 3 visitas rechazadas por el servidor');
  });
});
