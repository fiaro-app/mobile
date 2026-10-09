import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '@/features/visit/api/visit-api';
import { submitVisit } from '@/features/visit/lib/submit-visit';
import { paidVisit } from '@/features/visit/lib/visit-request';
import { flushVisitQueue, isPermanentRejection, refreshSyncCounts } from '@/features/visit/queue/flush-queue';
import { useSyncStore } from '@/features/visit/queue/sync-store';
import { enqueueVisit, readQueue, readQueueFor } from '@/features/visit/queue/visit-queue';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/features/visit/api/visit-api', () => ({ postVisit: jest.fn() }));

const post = jest.mocked(api.postVisit);
const ID1 = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e51';
const ID2 = '3f1d2c4e-5a6b-4c7d-8e9f-0a1b2c3d4e52';
const NOW = new Date('2026-10-09T20:30:00Z');
const http = (status: number, code: string | null = null) => ({ ok: false, failure: { kind: 'http', status, code, retryAfterSeconds: null } }) as const;
const offline = { ok: false, failure: { kind: 'offline' } } as const;
const item = (id: string, userId = 'u1') => ({ userId, loanId: 'l1', clientName: 'Marta Gómez', request: paidVisit(id, 35000, 'CASH', NOW) });

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  useSyncStore.getState().setCounts(0, 0);
});

describe('cola de visitas', () => {
  it('guarda en orden, no duplica por id y separa por usuario', async () => {
    await enqueueVisit(item(ID1));
    await enqueueVisit(item(ID1));
    await enqueueVisit(item(ID2, 'u2'));
    expect((await readQueue()).length).toBe(2);
    expect((await readQueueFor('u1')).map((i) => i.request.id)).toEqual([ID1]);
  });

  it('ignora datos corruptos en el almacenamiento', async () => {
    await AsyncStorage.setItem('fiaro.visit-queue', '{no es json');
    expect(await readQueue()).toEqual([]);
    await AsyncStorage.setItem('fiaro.visit-queue', JSON.stringify([{ nope: true }]));
    expect(await readQueue()).toEqual([]);
  });
});

describe('isPermanentRejection', () => {
  it.each([[400, true], [403, true], [404, true], [409, true], [422, true], [401, false], [408, false], [429, false], [500, false], [503, false]])('HTTP %s -> %s', (status, expected) => {
    expect(isPermanentRejection({ kind: 'http', status, code: null, retryAfterSeconds: null })).toBe(expected);
  });

  it('un fallo de red nunca es definitivo', () => {
    expect(isPermanentRejection({ kind: 'offline' })).toBe(false);
    expect(isPermanentRejection({ kind: 'maintenance' })).toBe(false);
  });
});

describe('submitVisit', () => {
  const input = { userId: 'u1', loanId: 'l1', clientName: 'Marta Gómez', request: paidVisit(ID1, 35000, 'CASH', NOW) };

  it('envía la visita si hay conexión', async () => {
    post.mockResolvedValue({ ok: true, value: {} });
    expect(await submitVisit(input)).toEqual({ kind: 'sent' });
    expect(await readQueue()).toEqual([]);
  });

  it('sin conexión la guarda y actualiza el contador', async () => {
    post.mockResolvedValue(offline);
    expect(await submitVisit(input)).toEqual({ kind: 'queued' });
    expect((await readQueue()).length).toBe(1);
    expect(useSyncStore.getState().pending).toBe(1);
  });

  it('un 500 también se guarda para reintentar', async () => {
    post.mockResolvedValue(http(500));
    expect((await submitVisit(input)).kind).toBe('queued');
  });

  it('un rechazo definitivo no se guarda y se devuelve', async () => {
    post.mockResolvedValue(http(400, 'VALIDATION_FAILED'));
    expect(await submitVisit(input)).toMatchObject({ kind: 'rejected' });
    expect(await readQueue()).toEqual([]);
  });

  it('con la sesión vencida no guarda nada', async () => {
    post.mockResolvedValue(http(401, 'UNAUTHENTICATED'));
    expect(await submitVisit(input)).toEqual({ kind: 'session-expired' });
    expect(await readQueue()).toEqual([]);
  });
});

describe('flushVisitQueue', () => {
  it('envía en orden y vacía la cola', async () => {
    await enqueueVisit(item(ID1));
    await enqueueVisit(item(ID2));
    post.mockResolvedValue({ ok: true, value: {} });
    await flushVisitQueue('u1');
    expect(post.mock.calls.map((c) => c[1].id)).toEqual([ID1, ID2]);
    expect(await readQueueFor('u1')).toEqual([]);
    expect(useSyncStore.getState()).toMatchObject({ pending: 0, rejected: 0 });
  });

  it('se detiene en el primer fallo pasajero y conserva el resto', async () => {
    await enqueueVisit(item(ID1));
    await enqueueVisit(item(ID2));
    post.mockResolvedValueOnce(offline);
    await flushVisitQueue('u1');
    expect(post).toHaveBeenCalledTimes(1);
    expect((await readQueueFor('u1')).length).toBe(2);
    expect(useSyncStore.getState().pending).toBe(2);
  });

  it('marca como rechazada una visita que el API rechaza y sigue con la siguiente', async () => {
    await enqueueVisit(item(ID1));
    await enqueueVisit(item(ID2));
    post.mockResolvedValueOnce(http(403, 'FORBIDDEN')).mockResolvedValueOnce({ ok: true, value: {} });
    await flushVisitQueue('u1');
    const left = await readQueueFor('u1');
    expect(left.map((i) => [i.request.id, i.status, i.rejectedCode])).toEqual([[ID1, 'rejected', 'FORBIDDEN']]);
    expect(useSyncStore.getState()).toMatchObject({ pending: 0, rejected: 1 });
  });

  it('no envía las visitas de otra persona', async () => {
    await enqueueVisit(item(ID1, 'otra'));
    await flushVisitQueue('u1');
    expect(post).not.toHaveBeenCalled();
  });

  it('dos llamadas simultáneas comparten un solo envío', async () => {
    await enqueueVisit(item(ID1));
    post.mockResolvedValue({ ok: true, value: {} });
    await Promise.all([flushVisitQueue('u1'), flushVisitQueue('u1')]);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('refreshSyncCounts cuenta pendientes y rechazadas', async () => {
    await enqueueVisit(item(ID1));
    await refreshSyncCounts('u1');
    expect(useSyncStore.getState().pending).toBe(1);
  });
});
