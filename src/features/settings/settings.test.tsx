import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as actions from '@/features/auth/store/session-actions';
import * as collectorsApi from '@/features/collectors/api/collectors-api';
import * as api from '@/features/settings/api/settings-api';
import { portfolioDeleteFailureMessage, SETTINGS_COPY, settingsFailureMessage } from '@/features/settings/content/messages';
import { useSettingsScreen } from '@/features/settings/hooks/use-settings-screen';
import { BRAND_PALETTE, brandColorError, swatchesFor } from '@/features/settings/lib/brand-palette';
import { MAX_PORTFOLIOS } from '@/features/settings/lib/portfolio-limit';
import { contrastWithWhite, MIN_BRAND_CONTRAST } from '@/features/settings/lib/color';
import { LenderSettingsSchema, sameWeekdays, SubscriptionSchema, toggleWeekday } from '@/features/settings/lib/settings-schemas';
import { subscriptionNotice, toSubscriptionView } from '@/features/settings/lib/subscription-view';
import * as brand from '@/lib/theme/brand';

jest.mock('@/features/settings/api/settings-api', () => ({
  fetchLenderSettings: jest.fn(), patchLender: jest.fn(), fetchPortfolioList: jest.fn(), createPortfolio: jest.fn(), renamePortfolio: jest.fn(), deletePortfolio: jest.fn(), fetchSubscription: jest.fn(),
}));
jest.mock('@/features/collectors/api/collectors-api', () => ({ fetchPortfolios: jest.fn() }));
jest.mock('@/features/auth/store/session-actions', () => ({ signOutIfSessionExpired: jest.fn() }));
jest.mock('@/lib/theme/brand', () => ({ applyBrandColor: jest.fn(), DEFAULT_BRAND_COLOR: '#3B3382' }));
jest.mock('@/lib/business-date', () => ({ ...jest.requireActual('@/lib/business-date') }));

const a = jest.mocked(api);
const settings = (over = {}) => ({ id: 'l1', name: 'El Águila', logoUrl: null, brandColor: null, nonWorkingWeekdays: ['SUNDAY' as const], skipNationalHolidays: false, ...over });
const sub = (over = {}) => ({ planCode: 'TRIAL', status: 'ACTIVE' as const, currentPeriodEndsAt: '2026-11-01T15:00:00Z', daysRemaining: 20, graceDaysRemaining: 7, isReadOnly: false, limits: { maxCollectors: 5 }, usage: { activeCollectors: 2 }, ...over });
const portfolios = [{ id: 'p1', name: 'General', isDefault: true }, { id: 'p2', name: 'Norte', isDefault: false }];
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  a.fetchLenderSettings.mockResolvedValue({ ok: true, value: settings() });
  a.fetchSubscription.mockResolvedValue({ ok: true, value: sub() });
  jest.mocked(collectorsApi).fetchPortfolios.mockResolvedValue({ ok: true, value: portfolios });
  a.patchLender.mockImplementation((patch) => Promise.resolve({ ok: true, value: settings(patch) }));
});

describe('lógica de configuración', () => {
  it('alterna días en el orden de la semana y compara listas', () => {
    expect(toggleWeekday(['SUNDAY'], 'MONDAY', true)).toEqual(['MONDAY', 'SUNDAY']);
    expect(toggleWeekday(['MONDAY', 'SUNDAY'], 'MONDAY', false)).toEqual(['SUNDAY']);
    expect(sameWeekdays(['MONDAY', 'SUNDAY'], ['SUNDAY', 'MONDAY'])).toBe(true);
    expect(sameWeekdays(['MONDAY'], ['SUNDAY'])).toBe(false);
    expect(sameWeekdays(['MONDAY'], [])).toBe(false);
  });

  it('el color de marca exige contraste con texto blanco', () => {
    expect(contrastWithWhite('#000000')).toBeCloseTo(21, 0);
    expect(contrastWithWhite('#FFFFFF')).toBeCloseTo(1, 1);
    expect(BRAND_PALETTE.every((swatch) => contrastWithWhite(swatch.value) >= MIN_BRAND_CONTRAST)).toBe(true);
    expect(brandColorError('#3B3382')).toBeNull();
    expect(brandColorError('rojo')).toMatch(/válido/);
    expect(brandColorError('#FFFF99')).toMatch(/más oscuro/);
    expect(swatchesFor(null)).toBe(BRAND_PALETTE);
    expect(swatchesFor('#1d4ed8')).toBe(BRAND_PALETTE);
    expect(swatchesFor('#123456').at(-1)).toEqual({ value: '#123456', label: 'Personalizado' });
  });

  it('avisos del plan', () => {
    expect(subscriptionNotice(sub())).toBeNull();
    expect(subscriptionNotice(sub({ daysRemaining: 3 }))?.message).toBe('Tu prueba gratis termina en 3 días.');
    expect(subscriptionNotice(sub({ daysRemaining: 1 }))?.message).toBe('Tu prueba gratis termina en 1 día.');
    expect(subscriptionNotice(sub({ daysRemaining: 0 }))?.message).toBe('Tu prueba gratis termina hoy.');
    expect(subscriptionNotice(sub({ status: 'GRACE_PERIOD', graceDaysRemaining: 1 }))).toMatchObject({ kind: 'warning', message: expect.stringContaining('1 día') as string });
    expect(subscriptionNotice(sub({ status: 'READ_ONLY', isReadOnly: true }))?.kind).toBe('error');
  });

  it('arma el bloque del plan', () => {
    const view = toSubscriptionView(sub());
    expect(view.rows).toEqual([{ label: 'Plan', value: 'Prueba gratis' }, { label: 'Estado', value: 'Activo' }, { label: 'Vence el', value: '1 nov 2026' }, { label: 'Días restantes', value: '20' }, { label: 'Cobradores activos', value: '2 de 5' }]);
    expect(view.collectorsPercent).toBe(40);
    expect(toSubscriptionView(sub({ limits: { maxCollectors: 0 }, planCode: 'PRO' })).collectorsPercent).toBe(0);
    expect(toSubscriptionView(sub({ usage: { activeCollectors: 9 } })).collectorsPercent).toBe(100);
  });

  it('valida las respuestas y traduce los fallos', () => {
    expect(LenderSettingsSchema.parse(settings()).name).toBe('El Águila');
    expect(SubscriptionSchema.parse(sub()).status).toBe('ACTIVE');
    expect(() => LenderSettingsSchema.parse({})).toThrow();
    expect(settingsFailureMessage({ kind: 'offline' })).toMatch(/Sin conexión/);
    expect(settingsFailureMessage({ kind: 'maintenance' })).toMatch(/mantenimiento/);
    expect(settingsFailureMessage({ kind: 'http', status: 409, code: 'CONFLICT', retryAfterSeconds: null })).toMatch(/ya tienes una cartera/i);
    expect(settingsFailureMessage({ kind: 'http', status: 403, code: 'FORBIDDEN', retryAfterSeconds: null })).toMatch(/permiso/);
    expect(settingsFailureMessage({ kind: 'http', status: 403, code: 'SUBSCRIPTION_READ_ONLY', retryAfterSeconds: null })).toMatch(/solo lectura/);
    expect(settingsFailureMessage({ kind: 'http', status: 403, code: 'PLAN_LIMIT_REACHED', retryAfterSeconds: null })).toMatch(/máximo de carteras/);
    expect(SETTINGS_COPY.portfolios.limit(MAX_PORTFOLIOS)).toMatch(/máximo de 4 carteras/);
    expect(settingsFailureMessage({ kind: 'http', status: 429, code: null, retryAfterSeconds: null })).toMatch(/Demasiados/);
    expect(settingsFailureMessage({ kind: 'http', status: 500, code: null, retryAfterSeconds: null })).toMatch(/No pudimos/);
    expect(portfolioDeleteFailureMessage({ kind: 'http', status: 409, code: 'CONFLICT', retryAfterSeconds: null })).toMatch(/por defecto/);
    expect(portfolioDeleteFailureMessage({ kind: 'http', status: 404, code: 'NOT_FOUND', retryAfterSeconds: null })).toMatch(/ya no existe/);
    expect(portfolioDeleteFailureMessage({ kind: 'offline' })).toMatch(/Sin conexión/);
  });
});

describe('useSettingsScreen', () => {
  const ready = async () => {
    const hook = await renderHook(() => useSettingsScreen(), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.loading).toBe(false);
      expect(hook.result.current.portfolioItems).toHaveLength(2);
    });
    return hook;
  };

  it('carga todo y distingue el fallo', async () => {
    const { result } = await ready();
    expect(result.current.business.name).toBe('El Águila');
    expect(result.current.plan?.rows).toHaveLength(5);
    expect(result.current.brand.color).toBe('#3B3382');
    a.fetchLenderSettings.mockResolvedValue({ ok: false, failure: { kind: 'offline' } });
    const failed = await renderHook(() => useSettingsScreen(), { wrapper });
    await waitFor(() => {
      expect(failed.result.current.loadFailed).toBe(true);
    });
    await act(async () => {
      failed.result.current.refresh();
    });
  });

  it('guarda el nombre solo si es válido y cambió', async () => {
    const { result } = await ready();
    expect(result.current.business.dirty).toBe(false);
    await act(async () => {
      result.current.business.setName('A');
    });
    await act(async () => {
      result.current.business.save();
    });
    expect(result.current.business.error).toMatch(/2 a 120/);
    await act(async () => {
      result.current.business.setName('Préstamos El Águila');
    });
    expect(result.current.business.dirty).toBe(true);
    await act(async () => {
      result.current.business.save();
    });
    await waitFor(() => {
      expect(result.current.business.notice).toBe('Nombre guardado.');
    });
    expect(a.patchLender).toHaveBeenCalledWith({ name: 'Préstamos El Águila' });
  });

  it('guarda el color, lo aplica y permite volver al de Fiaro', async () => {
    const { result } = await ready();
    await act(async () => {
      result.current.brand.choose('#1D4ED8');
    });
    expect(result.current.brand.dirty).toBe(true);
    await act(async () => {
      result.current.brand.save();
    });
    await waitFor(() => {
      expect(brand.applyBrandColor).toHaveBeenCalledWith('#1D4ED8');
    });
    expect(a.patchLender).toHaveBeenCalledWith({ brandColor: '#1D4ED8' });
    await act(async () => {
      result.current.brand.choose('#FFFF99');
    });
    await act(async () => {
      result.current.brand.save();
    });
    expect(result.current.brand.error).toMatch(/más oscuro/);
    await act(async () => {
      result.current.brand.reset();
    });
    await waitFor(() => {
      expect(a.patchLender).toHaveBeenCalledWith({ brandColor: null });
    });
    expect(brand.applyBrandColor).toHaveBeenLastCalledWith('#3B3382');
  });

  it('guarda los días sin cobro y los festivos', async () => {
    const { result } = await ready();
    expect(result.current.days).toMatchObject({ weekdays: ['SUNDAY'], skipHolidays: false, dirty: false });
    await act(async () => {
      result.current.days.toggle('SATURDAY', true);
      result.current.days.setSkipHolidays(true);
    });
    expect(result.current.days).toMatchObject({ weekdays: ['SATURDAY', 'SUNDAY'], dirty: true });
    await act(async () => {
      result.current.days.save();
    });
    await waitFor(() => {
      expect(result.current.days.notice).toBe('Días guardados.');
    });
    expect(a.patchLender).toHaveBeenCalledWith({ nonWorkingWeekdays: ['SATURDAY', 'SUNDAY'], skipNationalHolidays: true });
  });

  it('un fallo al guardar se explica y cierra la sesión vencida', async () => {
    a.patchLender.mockResolvedValueOnce(http(401));
    const { result } = await ready();
    await act(async () => {
      result.current.days.toggle('MONDAY', true);
    });
    await act(async () => {
      result.current.days.save();
    });
    await waitFor(() => {
      expect(actions.signOutIfSessionExpired).toHaveBeenCalled();
    });
  });

  it('crea, renombra y borra carteras', async () => {
    a.createPortfolio.mockResolvedValue({ ok: true, value: { id: 'p3', name: 'Sur', isDefault: false } });
    a.renamePortfolio.mockResolvedValue({ ok: true, value: { id: 'p2', name: 'Norte 2', isDefault: false } });
    a.deletePortfolio.mockResolvedValue({ ok: true, value: null });
    const { result } = await ready();
    await act(async () => {
      result.current.portfolios.startCreate();
    });
    await act(async () => {
      result.current.portfolios.submitName();
    });
    expect(result.current.portfolios.nameError).toMatch(/nombre/);
    await act(async () => {
      result.current.portfolios.setName('Sur');
    });
    await act(async () => {
      result.current.portfolios.submitName();
    });
    await waitFor(() => {
      expect(result.current.portfolios.notice).toBe('Cartera creada.');
    });
    expect(result.current.portfolios.mode.kind).toBe('none');
    await act(async () => {
      result.current.portfolios.startRename(portfolios[1]!);
    });
    expect(result.current.portfolios.name).toBe('Norte');
    await act(async () => {
      result.current.portfolios.setName('Norte 2');
    });
    await act(async () => {
      result.current.portfolios.submitName();
    });
    await waitFor(() => {
      expect(a.renamePortfolio).toHaveBeenCalledWith('p2', 'Norte 2');
    });
    await act(async () => {
      result.current.portfolios.startDelete(portfolios[1]!);
    });
    expect(result.current.portfolios.deleting?.name).toBe('Norte');
    await act(async () => {
      result.current.portfolios.confirmDelete();
    });
    await waitFor(() => {
      expect(a.deletePortfolio).toHaveBeenCalledWith('p2');
    });
    await waitFor(() => {
      expect(result.current.portfolios.mode.kind).toBe('none');
    });
  });

  it('explica por qué no se puede borrar y permite cancelar', async () => {
    a.deletePortfolio.mockResolvedValue(http(409, 'CONFLICT'));
    const { result } = await ready();
    await act(async () => {
      result.current.portfolios.startDelete(portfolios[0]!);
    });
    await act(async () => {
      result.current.portfolios.confirmDelete();
    });
    await waitFor(() => {
      expect(result.current.portfolios.error).toMatch(/por defecto/);
    });
    await act(async () => {
      result.current.portfolios.startCreate();
      result.current.portfolios.cancel();
      result.current.portfolios.confirmDelete();
    });
    expect(result.current.portfolios.mode.kind).toBe('none');
  });
});
