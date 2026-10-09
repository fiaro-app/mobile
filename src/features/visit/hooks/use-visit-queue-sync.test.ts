import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { renderHook } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { RETRY_INTERVAL_MS, useVisitQueueSync } from '@/features/visit/hooks/use-visit-queue-sync';
import * as flush from '@/features/visit/queue/flush-queue';
import { useSyncStore } from '@/features/visit/queue/sync-store';

jest.mock('expo-network', () => ({ addNetworkStateListener: jest.fn() }));
jest.mock('@/features/visit/queue/flush-queue', () => ({
  flushVisitQueue: jest.fn().mockResolvedValue(0),
  refreshSyncCounts: jest.fn().mockResolvedValue(undefined),
}));

const flushQueue = jest.mocked(flush.flushVisitQueue);
const addListener = jest.mocked(Network.addNetworkStateListener);
const remove = jest.fn();
const queryClient = new QueryClient();
const wrapper = ({ children }: Readonly<{ children: ReactNode }>) => createElement(QueryClientProvider, { client: queryClient }, children);
const setup = (userId: string | null) => renderHook(() => useVisitQueueSync(userId), { wrapper });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  addListener.mockReturnValue({ remove });
  useSyncStore.getState().setCounts(0, 0);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useVisitQueueSync', () => {
  it('sin usuario no hace nada', async () => {
    await setup(null);
    expect(flushQueue).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalled();
  });

  it('con usuario cuenta y envía al abrir, y escucha la red', async () => {
    await setup('u1');
    await Promise.resolve();
    expect(flush.refreshSyncCounts).toHaveBeenCalledWith('u1');
    expect(flushQueue).toHaveBeenCalledWith('u1');
    expect(addListener).toHaveBeenCalled();
  });

  it('envía cuando vuelve la conexión y no cuando se pierde', async () => {
    await setup('u1');
    await Promise.resolve();
    flushQueue.mockClear();
    const listener = addListener.mock.calls[0]?.[0] as (state: { isConnected: boolean }) => void;
    listener({ isConnected: false });
    expect(flushQueue).not.toHaveBeenCalled();
    listener({ isConnected: true });
    expect(flushQueue).toHaveBeenCalledWith('u1');
  });

  it('reintenta cada 30 s solo mientras hay pendientes', async () => {
    useSyncStore.getState().setCounts(2, 0);
    await setup('u1');
    await Promise.resolve();
    flushQueue.mockClear();
    jest.advanceTimersByTime(RETRY_INTERVAL_MS * 2);
    expect(flushQueue).toHaveBeenCalledTimes(2);
  });

  it('sin pendientes no programa reintentos', async () => {
    await setup('u1');
    await Promise.resolve();
    flushQueue.mockClear();
    jest.advanceTimersByTime(RETRY_INTERVAL_MS * 3);
    expect(flushQueue).not.toHaveBeenCalled();
  });

  it('refresca las consultas cuando la cola envió algo', async () => {
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    flushQueue.mockResolvedValueOnce(2);
    await setup('u1');
    await Promise.resolve();
    await Promise.resolve();
    expect(invalidate).toHaveBeenCalled();
    invalidate.mockClear();
    flushQueue.mockResolvedValue(0);
    const listener = addListener.mock.calls[addListener.mock.calls.length - 1]?.[0] as (state: { isConnected: boolean }) => void;
    listener({ isConnected: true });
    await Promise.resolve();
    expect(invalidate).not.toHaveBeenCalled();
    invalidate.mockRestore();
  });

  it('envía al volver la app a primer plano y limpia al desmontar', async () => {
    const appRemove = jest.fn();
    const spy = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: appRemove });
    const { unmount } = await setup('u1');
    await Promise.resolve();
    flushQueue.mockClear();
    const change = spy.mock.calls[0]?.[1] as (status: string) => void;
    change('background');
    expect(flushQueue).not.toHaveBeenCalled();
    change('active');
    expect(flushQueue).toHaveBeenCalledWith('u1');
    await unmount();
    expect(remove).toHaveBeenCalled();
    expect(appRemove).toHaveBeenCalled();
    spy.mockRestore();
  });
});
