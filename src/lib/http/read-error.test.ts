import { readErrorBody } from '@/lib/http/read-error';

const respond = (body: () => Promise<unknown>) => ({ json: body }) as unknown as Response;

describe('readErrorBody', () => {
  it('lee code y errorCode', async () => {
    expect(await readErrorBody(respond(() => Promise.resolve({ code: 'NOT_FOUND', errorCode: 'L003A' })))).toEqual({ code: 'NOT_FOUND', errorCode: 'L003A' });
  });
  it('devuelve null cuando falta o el cuerpo no es JSON', async () => {
    expect(await readErrorBody(respond(() => Promise.resolve({ code: 5 })))).toEqual({ code: null, errorCode: null });
    expect(await readErrorBody(respond(() => Promise.resolve('texto')))).toEqual({ code: null, errorCode: null });
    expect(await readErrorBody(respond(() => Promise.reject(new Error('x'))))).toEqual({ code: null, errorCode: null });
  });
});
