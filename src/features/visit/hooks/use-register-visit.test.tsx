import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as detailHook from '@/features/client-detail/hooks/use-client-detail';
import type { ClientDetailModel } from '@/features/client-detail/lib/detail-view-model';
import { useRegisterVisit } from '@/features/visit/hooks/use-register-visit';
import * as submit from '@/features/visit/lib/submit-visit';
import { useSessionStore } from '@/features/auth/store/session-store';

jest.mock('@/features/client-detail/hooks/use-client-detail', () => ({ useClientDetail: jest.fn() }));
jest.mock('@/features/visit/lib/submit-visit', () => ({ submitVisit: jest.fn() }));
jest.mock('@/features/visit/lib/visit-id', () => ({ newVisitId: jest.fn().mockReturnValue('3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f') }));

const useDetail = jest.mocked(detailHook.useClientDetail);
const submitVisit = jest.mocked(submit.submitVisit);
const model = { name: 'Marta Gómez', balance: 420000, balanceLabel: '$420.000', installmentValue: 35000 } as ClientDetailModel;
const user = { id: 'u1', fullName: 'Ana Pérez', phone: '+573001234567', mustChangePassword: false };

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })}>{children}</QueryClientProvider>;
}

const setup = async (onDone = jest.fn()) => ({ onDone, ...(await renderHook(() => useRegisterVisit('c1', 'l1', onDone), { wrapper })) });

beforeEach(() => {
  jest.clearAllMocks();
  useDetail.mockReturnValue({ state: 'ready', model, refreshing: false, refresh: jest.fn() });
  useSessionStore.getState().signedIn({ user, pinEnabled: false, pinOfferPending: false });
});

describe('useRegisterVisit', () => {
  it('precarga el monto con la cuota y el medio en efectivo', async () => {
    const { result } = await setup();
    expect(result.current).toMatchObject({ ready: true, amountText: '35.000', method: 'CASH', balanceLabel: '$420.000', confirmOpen: false });
  });

  it('no abre la confirmación con un monto inválido', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.setAmount('');
    });
    await act(async () => {
      result.current.requestConfirm();
    });
    expect(result.current.amountError).toContain('mayor a cero');
    expect(result.current.confirmOpen).toBe(false);
    await act(async () => {
      result.current.setAmount('500000');
    });
    await act(async () => {
      result.current.requestConfirm();
    });
    expect(result.current.amountError).toContain('$420.000');
  });

  it('pago completo: confirma, envía y avisa que se envió', async () => {
    submitVisit.mockResolvedValue({ kind: 'sent' });
    const { result, onDone } = await setup();
    await act(async () => {
      result.current.requestConfirm();
    });
    expect(result.current.confirmOpen).toBe(true);
    expect(result.current.confirmText).toContain('pago completo');
    await act(async () => {
      result.current.confirmPayment();
    });
    expect(submitVisit).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', loanId: 'l1', clientName: 'Marta Gómez', request: expect.objectContaining({ outcome: 'PAID', payment: { amount: 35000, method: 'CASH' } }) }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'sent', paid: true });
  });

  it('pago parcial con otro medio: el texto dice "parcial"', async () => {
    submitVisit.mockResolvedValue({ kind: 'queued' });
    const { result, onDone } = await setup();
    await act(async () => {
      result.current.setAmount('20000');
      result.current.setMethod('NEQUI');
    });
    await act(async () => {
      result.current.requestConfirm();
    });
    expect(result.current.confirmText).toContain('pago parcial');
    expect(result.current.confirmText).toContain('nequi');
    await act(async () => {
      result.current.confirmPayment();
    });
    expect(onDone).toHaveBeenCalledWith({ kind: 'queued', paid: true });
  });

  it('cancelar la confirmación no envía nada', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.requestConfirm();
    });
    await act(async () => {
      result.current.cancelConfirm();
    });
    expect(result.current.confirmOpen).toBe(false);
    expect(submitVisit).not.toHaveBeenCalled();
  });

  it('un rechazo del API muestra el error y renueva el id', async () => {
    submitVisit.mockResolvedValue({ kind: 'rejected', failure: { kind: 'http', status: 400, code: 'VALIDATION_FAILED', retryAfterSeconds: null } });
    const { result, onDone } = await setup();
    await act(async () => {
      result.current.requestConfirm();
    });
    await act(async () => {
      result.current.confirmPayment();
    });
    expect(result.current.formError).toContain('No pudimos registrar');
    expect(onDone).not.toHaveBeenCalled();
    expect(result.current.submitting).toBe(false);
  });

  it('con la sesión vencida avisa y no continúa', async () => {
    submitVisit.mockResolvedValue({ kind: 'session-expired' });
    const { result, onDone } = await setup();
    await act(async () => {
      result.current.requestConfirm();
    });
    await act(async () => {
      result.current.confirmPayment();
    });
    expect(result.current.formError).toContain('sesión venció');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('"No lo encontré" y "Se negó" se envían sin pago', async () => {
    submitVisit.mockResolvedValue({ kind: 'sent' });
    const { result, onDone } = await setup();
    await act(async () => {
      result.current.openOutcomeSheet();
    });
    expect(result.current.sheet).toBe('outcome');
    await act(async () => {
      result.current.chooseOutcome('NOT_FOUND');
    });
    expect(submitVisit).toHaveBeenCalledWith(expect.objectContaining({ request: expect.objectContaining({ outcome: 'NOT_FOUND' }) }));
    expect(onDone).toHaveBeenCalledWith({ kind: 'sent', paid: false });
    expect(result.current.sheet).toBe('none');
  });

  it('reprogramar abre la hoja de fecha y envía la fecha elegida', async () => {
    submitVisit.mockResolvedValue({ kind: 'sent' });
    const { result } = await setup();
    await act(async () => {
      result.current.chooseOutcome('RESCHEDULED');
    });
    expect(result.current.sheet).toBe('reschedule');
    const target = result.current.dateOptions[3]?.value ?? '';
    await act(async () => {
      result.current.setRescheduleDate(target);
    });
    await act(async () => {
      result.current.saveReschedule();
    });
    expect(submitVisit).toHaveBeenCalledWith(expect.objectContaining({ request: expect.objectContaining({ outcome: 'RESCHEDULED', promisedDate: target }) }));
  });

  it('cierra la hoja', async () => {
    const { result } = await setup();
    await act(async () => {
      result.current.openOutcomeSheet();
    });
    await act(async () => {
      result.current.closeSheet();
    });
    expect(result.current.sheet).toBe('none');
  });

  it('sin modelo cargado no envía', async () => {
    useDetail.mockReturnValue({ state: 'loading', model: null, refreshing: false, refresh: jest.fn() });
    const { result } = await setup();
    expect(result.current).toMatchObject({ ready: false, loadFailed: false });
    await act(async () => {
      result.current.chooseOutcome('REFUSED');
    });
    expect(submitVisit).not.toHaveBeenCalled();
  });
});
