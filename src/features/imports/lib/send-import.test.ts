import { runImport } from '@/features/imports/api/imports-api';
import type { ImportRow } from '@/features/imports/lib/import-schemas';
import type { ParsedRow } from '@/features/imports/lib/parse-sheet';
import { ImportSendError, sendImport } from '@/features/imports/lib/send-import';
import { fail, ok } from '@/lib/result';

jest.mock('@/features/imports/api/imports-api', () => ({ runImport: jest.fn() }));

const ROW: ImportRow = { nationalId: '1', fullName: 'Ana', occupation: '', phone: '3001112222', address: '', loan: null };
const sheet = (count: number): ParsedRow[] => Array.from({ length: count }, (_, i) => ({ sheetRow: i + 2, row: ROW, problems: [] }));
const answer = (count: number, status: 'READY' | 'IMPORTED') => ({ rows: Array.from({ length: count }, (_, i) => ({ row: i + 1, status, issues: [] })) });
const OFFLINE = { kind: 'offline' } as const;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('sendImport', () => {
  it('keeps rows with problems out of the request and reports them with their sheet row', async () => {
    jest.mocked(runImport).mockResolvedValue(ok(answer(1, 'READY')));
    const parsed: ParsedRow[] = [{ sheetRow: 2, row: null, problems: ['mal'] }, { sheetRow: 3, row: ROW, problems: [] }];

    const items = await sendImport(parsed, true, () => 'x');

    expect(runImport).toHaveBeenCalledWith([ROW], true);
    expect(items).toEqual([{ sheetRow: 2, status: 'INVALID', problems: ['mal'] }, { sheetRow: 3, status: 'READY', problems: [] }]);
  });

  it('sends 200 rows per request', async () => {
    jest.mocked(runImport).mockResolvedValueOnce(ok(answer(200, 'IMPORTED'))).mockResolvedValueOnce(ok(answer(5, 'IMPORTED')));

    const items = await sendImport(sheet(205), false, () => 'x');

    expect(runImport).toHaveBeenCalledTimes(2);
    expect(items).toHaveLength(205);
    expect(items.at(-1)?.sheetRow).toBe(206);
  });

  it('throws when the review or the first batch fails', async () => {
    jest.mocked(runImport).mockResolvedValue(fail(OFFLINE));

    await expect(sendImport(sheet(1), true, () => 'x')).rejects.toBeInstanceOf(ImportSendError);
    await expect(sendImport(sheet(1), false, () => 'x')).rejects.toBeInstanceOf(ImportSendError);
  });

  it('keeps what was created when a later batch fails and marks the rest as failed', async () => {
    jest.mocked(runImport).mockResolvedValueOnce(ok(answer(200, 'IMPORTED'))).mockResolvedValueOnce(fail(OFFLINE));

    const items = await sendImport(sheet(201), false, () => 'sin red');

    expect(items.filter((item) => item.status === 'IMPORTED')).toHaveLength(200);
    expect(items.at(-1)).toEqual({ sheetRow: 202, status: 'FAILED', problems: ['sin red'] });
  });

  it('ignores a result that points outside the batch', async () => {
    jest.mocked(runImport).mockResolvedValue(ok({ rows: [{ row: 9, status: 'READY', issues: [] }] }));

    expect(await sendImport(sheet(1), true, () => 'x')).toEqual([]);
  });
});
