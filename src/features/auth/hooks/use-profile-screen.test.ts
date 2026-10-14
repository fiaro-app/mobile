import { renderHook } from '@testing-library/react-native';
import { useProfileScreen } from '@/features/auth/hooks/use-profile-screen';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';
import { useWorkspaceStore } from '@/features/workspace/store/workspace-store';

jest.mock('@/features/auth/store/session-actions', () => ({ completeSignOut: jest.fn() }));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

describe('useProfileScreen', () => {
  it('expone los datos de la persona y cierra la sesión', async () => {
    useSessionStore.getState().signedIn({
      user: { id: '1', fullName: 'Alejo Pérez', phone: '+573001234567', mustChangePassword: false },
      pinEnabled: false,
      pinOfferPending: false,
    });
    const { result } = await renderHook(() => useProfileScreen());
    expect(result.current).toMatchObject({ fullName: 'Alejo Pérez', firstName: 'Alejo', initials: 'AP', phone: '+573001234567' });
    result.current.signOut();
    expect(actions.completeSignOut).toHaveBeenCalled();
  });

  it('sin sesión devuelve textos vacíos', async () => {
    useSessionStore.getState().signedOut();
    const { result } = await renderHook(() => useProfileScreen());
    expect(result.current.fullName).toBe('');
  });

  it('cambiar de modo lleva al inicio del modo nuevo', async () => {
    useWorkspaceStore.getState().loaded(['OWNER', 'COLLECTOR']);
    const { result } = await renderHook(() => useProfileScreen());
    expect(result.current.switchLabel).toBe('Cambiar a modo Cobrador');
    result.current.switchMode();
    expect(useWorkspaceStore.getState().mode).toBe('collector');
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
