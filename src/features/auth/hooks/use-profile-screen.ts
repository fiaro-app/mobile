import { initials, firstName } from '@/features/auth/lib/names';
import { completeSignOut } from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

function emailStatusOf(email: string | null | undefined, verified: boolean | undefined): string {
  if (!email) return 'Sin correo';
  return verified === true ? 'Verificado' : 'Sin verificar';
}

/** Lo que la pantalla de perfil dibuja y puede hacer. */
export interface ProfileScreen {
  readonly fullName: string;
  readonly firstName: string;
  readonly initials: string;
  readonly phone: string;
  /** Estado del correo de contacto para mostrarlo junto a la fila: verificado, sin verificar o sin correo. */
  readonly emailStatus: string;
  readonly signOut: () => void;
}

/**
 * Datos de la persona con sesión y la acción de cerrarla.
 */
export function useProfileScreen(): ProfileScreen {
  const user = useSessionStore((state) => state.user);
  const fullName = user?.fullName ?? '';
  return {
    fullName,
    firstName: firstName(fullName),
    initials: initials(fullName),
    phone: user?.phone ?? '',
    emailStatus: emailStatusOf(user?.contactEmail, user?.contactEmailVerified),
    signOut: () => {
      void completeSignOut();
    },
  };
}
