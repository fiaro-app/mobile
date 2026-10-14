import { renderHook } from '@testing-library/react-native';
import { useProfileScreen } from '@/features/auth/hooks/use-profile-screen';
import * as actions from '@/features/auth/store/session-actions';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/auth/store/session-actions', () => ({ completeSignOut: jest.fn() }));

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
});
