import { z } from 'zod';

export const SeveritySchema = z.enum(['ALERT', 'WARNING', 'SUCCESS', 'INFO']);
export type Severity = z.infer<typeof SeveritySchema>;

export const EntityTypeSchema = z.enum(['DAILY_SETTLEMENT', 'LOAN', 'CLIENT', 'MEMBERSHIP', 'SUBSCRIPTION']);
export type EntityType = z.infer<typeof EntityTypeSchema>;

/** Una notificación tal como la devuelve `QUERY /notifications`. */
export const NotificationSchema = z.object({
  id: z.string(),
  severity: SeveritySchema,
  title: z.string(),
  body: z.string(),
  relatedEntityType: EntityTypeSchema.nullable(),
  relatedEntityId: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AppNotification = z.infer<typeof NotificationSchema>;

/** Página de notificaciones: `{ data, meta }`. */
export const NotificationsPageSchema = z.object({
  data: z.array(NotificationSchema),
  meta: z.object({ total: z.number() }),
});

export const UnreadCountSchema = z.object({ count: z.number().int().nonnegative() });
