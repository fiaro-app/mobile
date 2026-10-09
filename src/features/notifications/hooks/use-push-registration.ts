import { useEffect } from 'react';
import { registerPushForSession } from '@/features/notifications/push/push-registration';

/** Registra el token push una vez por sesión iniciada (`userId` en `null` = sin sesión, no hace nada). */
export function usePushRegistration(userId: string | null): void {
  useEffect(() => {
    if (userId) void registerPushForSession();
  }, [userId]);
}
