/**
 * Texto de la franja de la ruta según la cola de visitas: pendientes de enviar y, aparte, las que el API
 * rechazó (no se reintentan y el cobrador debe saberlo). `null` si no hay nada que avisar.
 */
export function syncBannerMessage(pending: number, rejected: number): string | null {
  const parts: string[] = [];
  if (pending > 0) parts.push(`${String(pending)} ${pending === 1 ? 'visita pendiente' : 'visitas pendientes'} de sincronizar`);
  if (rejected > 0) parts.push(`${String(rejected)} ${rejected === 1 ? 'visita rechazada' : 'visitas rechazadas'} por el servidor`);
  return parts.length > 0 ? parts.join(' · ') : null;
}
