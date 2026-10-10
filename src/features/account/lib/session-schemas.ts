import { z } from 'zod';
import { formatShortDate } from '@/lib/business-date';

/** Sesión abierta de la persona (`GET /account/sessions`). */
export const AccountSessionSchema = z.object({
  id: z.string(),
  isCurrent: z.boolean(),
  device: z.object({ label: z.string() }),
  ipAddress: z.string().nullable(),
  lastUsedAt: z.string(),
});
export type AccountSession = z.infer<typeof AccountSessionSchema>;

/** Una sesión lista para dibujar. */
export interface SessionRowModel {
  readonly id: string;
  readonly device: string;
  readonly detail: string;
  readonly isCurrent: boolean;
}

/** La actual primero y luego por último uso (la más reciente arriba); el detalle dice la IP y cuándo se usó. */
export function toSessionRows(sessions: readonly AccountSession[]): SessionRowModel[] {
  return sessions
    .toSorted((a, b) => Number(b.isCurrent) - Number(a.isCurrent) || b.lastUsedAt.localeCompare(a.lastUsedAt))
    .map((session) => ({
      id: session.id,
      device: session.device.label,
      isCurrent: session.isCurrent,
      detail: `${session.ipAddress ? `IP ${session.ipAddress} · ` : ''}${session.isCurrent ? 'activa ahora' : `último uso ${formatShortDate(session.lastUsedAt)}`}`,
    }));
}
