import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import { VisitRequestSchema } from '@/features/visit/lib/visit-request';

const STORAGE_KEY = 'fiaro.visit-queue';

/**
 * Visita guardada en el teléfono esperando enviarse. Lleva el `userId` de quien la hizo: si otra
 * persona inicia sesión en el mismo teléfono, sus visitas NO deben enviarse con la sesión de esa otra
 * (el API validaría la asignación con la persona equivocada).
 */
export const QueueItemSchema = z.object({
  userId: z.string(),
  loanId: z.string(),
  clientName: z.string(),
  request: VisitRequestSchema,
  queuedAt: z.string(),
  status: z.enum(['pending', 'rejected']),
  rejectedCode: z.string().nullable().optional(),
});
export type QueueItem = z.infer<typeof QueueItemSchema>;

async function load(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = z.array(QueueItemSchema).safeParse(raw ? JSON.parse(raw) : []);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function save(items: QueueItem[]): Promise<void> {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Toda la cola (de todos los usuarios del teléfono). */
export function readQueue(): Promise<QueueItem[]> {
  return load();
}

/** La cola de una persona, en el orden en que se hicieron las visitas. */
export async function readQueueFor(userId: string): Promise<QueueItem[]> {
  return (await load()).filter((item) => item.userId === userId);
}

/** Agrega una visita pendiente al final. Si ya estaba (mismo `id`) no la duplica. */
export async function enqueueVisit(item: Omit<QueueItem, 'status' | 'queuedAt' | 'rejectedCode'>): Promise<void> {
  const items = await load();
  if (items.some((existing) => existing.request.id === item.request.id)) return;
  await save([...items, { ...item, status: 'pending', queuedAt: new Date().toISOString(), rejectedCode: null }]);
}

/** Quita una visita de la cola (ya se envió). */
export async function removeVisit(visitId: string): Promise<void> {
  await save((await load()).filter((item) => item.request.id !== visitId));
}

/** Marca una visita como rechazada de forma definitiva por el API (no se reintenta) y guarda el código. */
export async function markRejected(visitId: string, code: string | null): Promise<void> {
  await save((await load()).map((item) => (item.request.id === visitId ? { ...item, status: 'rejected', rejectedCode: code } : item)));
}
