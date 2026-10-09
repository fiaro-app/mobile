import { differenceLabel } from '@/features/settlement/content/messages';
import { buildSubmission, differenceOf, formFromSummary, totalOf } from '@/features/settlement/lib/settlement-form';
import { DailySummarySchema, SettlementSchema } from '@/features/settlement/lib/settlement-schemas';

const summary = { date: '2026-10-09', expectedAmount: 100000, collectedAmount: 90000, collectedByMethod: { CASH: 60000, NEQUI: 30000, TRANSFER: 0 } };
const form = formFromSummary(summary);

describe('formulario del cuadre', () => {
  it('precarga lo registrado con puntos de miles y suma los medios', () => {
    expect(form).toEqual({ cash: '60.000', nequi: '30.000', transfer: '0', note: '' });
    expect(totalOf(form)).toBe(90000);
    expect(totalOf({ ...form, cash: '', nequi: '', transfer: '' })).toBe(0);
  });

  it('calcula faltante, sobrante y cuadre', () => {
    expect(differenceOf(100000, form)).toBe(-10000);
    expect(differenceOf(90000, form)).toBe(0);
    expect(differenceLabel(-10000, '$10.000')).toBe('Faltan $10.000');
    expect(differenceLabel(5, '$5')).toBe('Sobran $5');
    expect(differenceLabel(0, '$0')).toBe('Cuadra con lo esperado');
  });

  it('exige nota cuando no cuadra', () => {
    expect(buildSubmission(100000, form)).toEqual({ ok: false, error: 'note-required' });
    expect(buildSubmission(100000, { ...form, note: '   ' })).toEqual({ ok: false, error: 'note-required' });
  });

  it('rechaza una nota demasiado larga', () => {
    expect(buildSubmission(90000, { ...form, note: 'a'.repeat(501) })).toEqual({ ok: false, error: 'note-too-long' });
  });

  it('arma la petición; la nota en blanco va como null cuando cuadra', () => {
    expect(buildSubmission(90000, form)).toEqual({
      ok: true,
      request: { expectedAmount: 90000, collectedCash: 60000, collectedNequi: 30000, collectedTransfer: 0, collectorNote: null },
    });
    const withNote = buildSubmission(100000, { ...form, note: ' Un cliente no pagó ' });
    expect(withNote).toMatchObject({ ok: true, request: { collectorNote: 'Un cliente no pagó' } });
  });
});

describe('schemas', () => {
  it('validan el resumen y el cuadre', () => {
    expect(DailySummarySchema.parse(summary)).toMatchObject({ date: '2026-10-09' });
    expect(() => DailySummarySchema.parse({ ...summary, expectedAmount: -1 })).toThrow();
    const settlement = { id: 's1', date: '2026-10-09', expectedAmount: 1, collectedAmount: 1, collectedByMethod: summary.collectedByMethod, status: 'PENDING', collectorNote: null, reviewNote: null };
    expect(SettlementSchema.parse(settlement).status).toBe('PENDING');
    expect(() => SettlementSchema.parse({ ...settlement, status: 'OTRO' })).toThrow();
  });
});
