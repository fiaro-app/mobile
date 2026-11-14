import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as api from '@/features/collectors/api/collectors-api';
import { useCollectorForm } from '@/features/collectors/hooks/use-collector-form';
import { useCollectorManage } from '@/features/collectors/hooks/use-collector-manage';
import { useCollectorsScreen } from '@/features/collectors/hooks/use-collectors-screen';
import * as team from '@/features/team/api/team-api';
import * as share from '@/lib/share-text';

jest.mock('@/features/collectors/api/collectors-api', () => ({
  inviteCollector: jest.fn(),
  deactivateCollector: jest.fn(),
  resetCollectorPassword: jest.fn(),
  changeCollectorPortfolio: jest.fn(),
  fetchPortfolios: jest.fn(),
  fetchCollectorStats: jest.fn(),
  fetchCollectorActiveLoanIds: jest.fn(),
  reactivateCollector: jest.fn(),
  deleteCollector: jest.fn(),
}));
jest.mock('@/features/team/api/team-api', () => ({ fetchMembers: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/share-text', () => ({ shareText: jest.fn() }));

const a = jest.mocked(api);
const t = jest.mocked(team);
const members = [
  { id: 'm1', userId: 'u1', fullName: 'Ana Gómez', phone: '+573001234567', roles: ['COLLECTOR' as const], status: 'ACTIVE' as const, portfolioId: 'p1' },
  { id: 'm2', userId: 'u2', fullName: 'Luis Díaz', phone: '+573115550102', roles: ['COLLECTOR' as const], status: 'INACTIVE' as const, portfolioId: null },
];
const portfolios = [{ id: 'p1', name: 'General', isDefault: true }, { id: 'p2', name: 'Norte', isDefault: false }];
const stats = { from: '2026-10-01', to: '2026-10-09', expectedAmount: 100, collectedAmount: 90, effectiveness: 0.9, visitsCount: 2, overdueAmount: 0 };
const expired = { kind: 'http', status: 401, code: null, retryAfterSeconds: null } as const;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  t.fetchMembers.mockResolvedValue({ ok: true, value: members });
  a.fetchPortfolios.mockResolvedValue({ ok: true, value: portfolios });
  a.fetchCollectorStats.mockResolvedValue({ ok: true, value: stats });
  a.fetchCollectorActiveLoanIds.mockResolvedValue({ ok: true, value: [] });
});

describe('useCollectorsScreen', () => {
  it('lista, busca y filtra', async () => {
    const { result } = await renderHook(() => useCollectorsScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.rows.map((row) => row.name)).toEqual(['Ana Gómez']);
    await act(async () => {
      result.current.setStatus('all');
    });
    expect(result.current.rows.map((row) => row.name)).toEqual(['Ana Gómez', 'Luis Díaz']);
    await act(async () => {
      result.current.setStatus('inactive');
    });
    expect(result.current.rows.map((row) => row.id)).toEqual(['m2']);
    await act(async () => {
      result.current.setSearch('zzz');
    });
    expect(result.current.empty).toBe('no-results');
  });

  it('distingue vacío, sin permiso y error', async () => {
    t.fetchMembers.mockResolvedValue({ ok: true, value: [] });
    const empty = await renderHook(() => useCollectorsScreen(), { wrapper });
    await waitFor(() => {
      expect(empty.result.current.empty).toBe('no-collectors');
    });
    t.fetchMembers.mockResolvedValue({ ok: false, failure: { kind: 'http', status: 403, code: 'FORBIDDEN', retryAfterSeconds: null } });
    const forbidden = await renderHook(() => useCollectorsScreen(), { wrapper });
    await waitFor(() => {
      expect(forbidden.result.current.empty).toBe('forbidden');
    });
    t.fetchMembers.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useCollectorsScreen(), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.empty).toBe('error');
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });
});

describe('useCollectorForm', () => {
  const fill = async (result: { current: ReturnType<typeof useCollectorForm> }) => {
    await act(async () => {
      result.current.fullName.onChangeText('Carlos Ramírez');
      result.current.nationalId.onChangeText('1020304050');
      result.current.phone.onChangeText('3001234567');
      result.current.contactEmail.onChangeText('carlos@correo.com');
    });
  };

  it('valida antes de enviar y precarga la cartera por defecto', async () => {
    const { result } = await renderHook(() => useCollectorForm(), { wrapper });
    await waitFor(() => {
      expect(result.current.portfolio.value).toBe('p1');
    });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.fullName.error).toMatch(/nombre/);
    });
    expect(a.inviteCollector).not.toHaveBeenCalled();
  });

  it('registra, muestra la contraseña temporal y la comparte', async () => {
    a.inviteCollector.mockResolvedValue({ ok: true, value: { membership: { id: 'm9' }, tempPassword: 'Kf7-29' } });
    const { result } = await renderHook(() => useCollectorForm(), { wrapper });
    await waitFor(() => {
      expect(result.current.portfolio.value).toBe('p1');
    });
    await fill(result);
    expect(result.current.phone.value).toBe('300 123 4567');
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.registered).toEqual({ name: 'Carlos Ramírez', phone: '300 123 4567', tempPassword: 'Kf7-29' });
    });
    await act(async () => {
      result.current.sharePassword();
    });
    expect(share.shareText).toHaveBeenCalledWith(expect.stringContaining('Kf7-29'));
  });

  it('elige otra cartera con la hoja', async () => {
    const { result } = await renderHook(() => useCollectorForm(), { wrapper });
    await waitFor(() => {
      expect(result.current.portfolio.options).toHaveLength(2);
    });
    await act(async () => {
      result.current.openSheet();
    });
    expect(result.current.sheetOpen).toBe(true);
    await act(async () => {
      result.current.portfolio.select('p2');
    });
    expect(result.current.portfolio.label).toBe('Norte');
    expect(result.current.sheetOpen).toBe(false);
    await act(async () => {
      result.current.openSheet();
      result.current.closeSheet();
    });
    expect(result.current.sheetOpen).toBe(false);
  });

  it('explica el conflicto y cierra la sesión si venció', async () => {
    a.inviteCollector.mockResolvedValueOnce({ ok: false, failure: { kind: 'http', status: 409, code: 'CONFLICT', retryAfterSeconds: null } });
    const { result } = await renderHook(() => useCollectorForm(), { wrapper });
    await waitFor(() => {
      expect(result.current.portfolio.value).toBe('p1');
    });
    await fill(result);
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(result.current.formError).toMatch(/ya trabaja/);
    });
    a.inviteCollector.mockResolvedValueOnce({ ok: false, failure: expired });
    await act(async () => {
      result.current.submit();
    });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalledWith(expired);
    });
  });
});

describe('useCollectorManage', () => {
  const ready = async (id = 'm1') => {
    const hook = await renderHook(() => useCollectorManage(id), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.person).not.toBeNull();
    });
    return hook;
  };

  it('arma la persona, el desempeño y la cartera', async () => {
    const { result } = await ready();
    expect(result.current.person).toMatchObject({ name: 'Ana Gómez', phone: '300 123 4567', active: true, portfolio: 'General', initials: 'AG' });
    await waitFor(() => {
      expect(result.current.stats?.cards).toHaveLength(5);
    });
    expect(result.current).toMatchObject({ portfolioLabel: 'General', portfolioChanged: false });
  });

  it('un cobrador que no existe se marca como no encontrado', async () => {
    const { result } = await renderHook(() => useCollectorManage('nadie'), { wrapper });
    await waitFor(() => {
      expect(result.current.notFound).toBe(true);
    });
  });

  it('cambia de cartera y guarda', async () => {
    a.changeCollectorPortfolio.mockResolvedValue({ ok: true, value: {} });
    const { result } = await ready();
    await act(async () => {
      result.current.openDialog('portfolio');
    });
    await act(async () => {
      result.current.choosePortfolio('p2');
    });
    expect(result.current).toMatchObject({ portfolioChanged: true, portfolioLabel: 'Norte', dialog: 'none' });
    await act(async () => {
      result.current.savePortfolio();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cartera actualizada.');
    });
    expect(a.changeCollectorPortfolio).toHaveBeenCalledWith('m1', ['COLLECTOR'], 'p2');
  });

  it('no guarda si la cartera no cambió', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.savePortfolio();
    });
    expect(a.changeCollectorPortfolio).not.toHaveBeenCalled();
  });

  it('restablece la contraseña y la comparte', async () => {
    a.resetCollectorPassword.mockResolvedValue({ ok: true, value: 'Nueva-123' });
    const { result } = await ready();
    await act(async () => {
      result.current.openDialog('reset');
    });
    await act(async () => {
      result.current.confirmReset();
    });
    await waitFor(() => {
      expect(result.current.tempPassword).toBe('Nueva-123');
    });
    await act(async () => {
      result.current.shareTempPassword();
    });
    expect(share.shareText).toHaveBeenCalledWith(expect.stringContaining('Nueva-123'));
    await act(async () => {
      result.current.dismissTempPassword();
    });
    expect(result.current.tempPassword).toBeNull();
  });

  it('desactiva y explica los fallos', async () => {
    a.deactivateCollector.mockResolvedValueOnce({ ok: true, value: {} });
    const { result } = await ready();
    await waitFor(() => {
      expect(result.current.activeLoanCount).toBe(0);
    });
    await act(async () => {
      result.current.confirmDeactivate();
    });
    await waitFor(() => {
      expect(result.current.notice).toBe('Cobrador desactivado.');
    });
    a.deactivateCollector.mockResolvedValueOnce({ ok: false, failure: { kind: 'offline' } });
    await act(async () => {
      result.current.confirmDeactivate();
    });
    await waitFor(() => {
      expect(result.current.error).toMatch(/Sin conexión/);
    });
    await act(async () => {
      result.current.closeDialog();
    });
  });

  it('un cobrador inactivo se muestra como tal', async () => {
    const { result } = await ready('m2');
    expect(result.current.person).toMatchObject({ active: false, portfolio: 'Sin cartera' });
  });
});
