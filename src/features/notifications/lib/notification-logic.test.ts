import { NotificationsPageSchema } from '@/features/notifications/lib/notification-schemas';
import { targetOf, timeAgo, toRowModel } from '@/features/notifications/lib/notification-view-model';
import { bellLabel } from '@/features/notifications/content/messages';

const NOW = new Date('2026-10-09T15:00:00Z');
const base = { id: 'n1', severity: 'ALERT', title: 'Cuadre rechazado', body: 'Corrige y reenvía', relatedEntityType: 'DAILY_SETTLEMENT', relatedEntityId: 's1', readAt: null, createdAt: '2026-10-09T14:55:00Z' } as const;

describe('timeAgo', () => {
  it.each([
    ['2026-10-09T14:59:45Z', 'ahora'],
    ['2026-10-09T14:55:00Z', 'hace 5 min'],
    ['2026-10-09T12:00:00Z', 'hace 3 h'],
    ['2026-10-08T12:00:00Z', 'ayer'],
    ['2026-10-05T15:00:00Z', 'hace 4 días'],
    ['2026-09-20T15:00:00Z', '20 sep 2026'],
    ['2026-10-09T16:00:00Z', 'ahora'],
  ])('%s → %s', (iso, expected) => {
    expect(timeAgo(iso, NOW)).toBe(expected);
  });
});

describe('fila de la bandeja', () => {
  it('traduce severidad, lectura y destino', () => {
    expect(toRowModel(base, NOW)).toEqual({ id: 'n1', title: 'Cuadre rechazado', body: 'Corrige y reenvía', when: 'hace 5 min', unread: true, tone: 'destructive', target: '/settlement' });
    expect(toRowModel({ ...base, severity: 'SUCCESS', readAt: '2026-10-09T14:56:00Z', relatedEntityType: 'LOAN' }, NOW)).toMatchObject({ unread: false, tone: 'success', target: null });
    expect(toRowModel({ ...base, severity: 'WARNING' }, NOW).tone).toBe('warning');
    expect(toRowModel({ ...base, severity: 'INFO' }, NOW).tone).toBe('primary');
  });

  it('solo el cuadre tiene pantalla', () => {
    expect(targetOf('DAILY_SETTLEMENT')).toBe('/settlement');
    expect(targetOf('CLIENT')).toBeNull();
    expect(targetOf(null)).toBeNull();
  });

  it('valida la página y etiqueta la campana', () => {
    expect(NotificationsPageSchema.parse({ data: [base], meta: { total: 1 } }).data).toHaveLength(1);
    expect(() => NotificationsPageSchema.parse({ data: [{ ...base, severity: 'X' }], meta: { total: 1 } })).toThrow();
    expect(bellLabel(0)).toBe('Notificaciones');
    expect(bellLabel(3)).toBe('Notificaciones, 3 sin leer');
  });
});
