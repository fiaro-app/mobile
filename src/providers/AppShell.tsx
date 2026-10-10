import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { BlockedView } from '@/components/organisms/BlockedView';
import { useBootstrap } from '@/features/auth/hooks/use-bootstrap';
import { useAccess, useSessionStore } from '@/features/auth/store/session-store';
import { LoadingScreen } from '@/components/templates/LoadingScreen';
import { useWorkspace } from '@/features/workspace/hooks/use-workspace';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';
import { usePushRegistration } from '@/features/notifications/hooks/use-push-registration';
import { useVisitQueueSync } from '@/features/visit/hooks/use-visit-queue-sync';

/**
 * Decide qué ve la persona según el estado de la app, y es el ÚNICO lugar donde eso se decide:
 * 1. Mientras arranca (fuentes, versión, sesión) se deja el splash nativo a la vista.
 * 2. Si algo bloquea (sin conexión, mantenimiento, versión vieja) se muestra su pantalla.
 * 3. Si no, `Stack.Protected` deja existir solo las pantallas del estado de acceso actual; al
 *    cambiar el estado, Expo Router lleva a la primera pantalla permitida (por ejemplo, de login a
 *    inicio) sin que ninguna pantalla navegue a mano.
 */
export function AppShell({ fontsLoaded }: Readonly<{ fontsLoaded: boolean }>) {
  const boot = useBootstrap();
  const access = useAccess();
  const userId = useSessionStore((state) => state.user?.id ?? null);
  useVisitQueueSync(access === 'signed-in' ? userId : null);
  usePushRegistration(access === 'signed-in' ? userId : null);
  useWorkspace(access === 'signed-in' ? userId : null);
  const workspace = useWorkspaceStore((state) => state.status);
  const mode = useWorkspaceStore((state) => state.mode);
  const settled = fontsLoaded && (boot.ready || boot.blocked !== null);

  useEffect(() => {
    if (settled) void SplashScreen.hideAsync();
  }, [settled]);

  if (!settled) return null;
  if (boot.blocked) {
    return <BlockedView kind={boot.blocked} downloadUrl={boot.downloadUrl} retrying={boot.retrying} onRetry={boot.retry} />;
  }

  if (access === 'signed-in' && workspace !== 'ready') return <LoadingScreen />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F5FB' } }}>
      <Stack.Protected guard={access === 'signed-out'}>
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'locked'}>
        <Stack.Screen name="pin" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'must-change-password'}>
        <Stack.Screen name="change-password" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'offer-pin'}>
        <Stack.Screen name="create-pin" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'signed-in' && mode === 'admin'}>
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="admin/collectors/index" />
        <Stack.Screen name="admin/collectors/new" />
        <Stack.Screen name="admin/collectors/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'signed-in' && mode === 'collector'}>
        <Stack.Screen name="index" />
        <Stack.Screen name="clients" />
        <Stack.Screen name="settlement" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="client/[loanId]" />
        <Stack.Screen name="visit/[loanId]" />
        <Stack.Screen name="visit-done" />
      </Stack.Protected>
      <Stack.Protected guard={access === 'signed-in'}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="profile-edit" />
        <Stack.Screen name="notifications" />
      </Stack.Protected>
    </Stack>
  );
}
