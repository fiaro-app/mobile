import { COLLECTORS_COPY, collectorFailureMessage } from '@/features/collectors/content/messages';
import { CollectorFormSchema, InvitedSchema, normalizeNationalId, toInviteBody } from '@/features/collectors/lib/collector-schemas';
import { toCollectorStatsView } from '@/features/collectors/lib/collector-stats-view';
import { collectorsOf, displayPhone, fold, portfolioName, toCollectorRows } from '@/features/collectors/lib/collector-view-model';
import type { Member } from '@/features/team/lib/member-schemas';

const member = (id: string, fullName: string, over: Partial<Member> = {}): Member => ({ id, userId: `u-${id}`, fullName, phone: '+573001234567', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: 'p1', ...over });
const portfolios = [{ id: 'p1', name: 'General', isDefault: true }, { id: 'p2', name: 'Norte', isDefault: false }];
const valid = { fullName: 'Carlos Ramírez', nationalId: '1.020.304.050', phone: '300 123 4567', contactEmail: 'c@correo.com', portfolioId: 'p1' };

describe('formulario de cobrador', () => {
  it('acepta datos válidos', () => {
    expect(CollectorFormSchema.safeParse(valid).success).toBe(true);
    expect(CollectorFormSchema.safeParse({ ...valid, contactEmail: 'c@correo.com' }).success).toBe(true);
  });

  it.each([
    ['fullName', 'A'],
    ['nationalId', '12'],
    ['nationalId', '0123456'],
    ['phone', '123'],
    ['contactEmail', 'no-correo'],
    ['contactEmail', ''],
    ['portfolioId', ''],
  ])('rechaza %s = %j', (field, value) => {
    expect(CollectorFormSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });

  it('normaliza la cédula y arma el cuerpo de la invitación', () => {
    expect(normalizeNationalId('1.020 304-050')).toBe('1020304050');
    expect(toInviteBody(valid)).toEqual({ phone: '+573001234567', fullName: 'Carlos Ramírez', nationalId: '1020304050', contactEmail: 'c@correo.com', roles: ['COLLECTOR'], portfolioId: 'p1' });
  });

  it('valida la respuesta de invitar', () => {
    expect(InvitedSchema.parse({ membership: { id: 'm' }, tempPassword: null }).tempPassword).toBeNull();
    expect(() => InvitedSchema.parse({ id: 'm', tempPassword: null })).toThrow();
  });
});

describe('listado', () => {
  const members = [member('1', 'Zoe Torres'), member('2', 'Álvaro Díaz', { status: 'INACTIVE', portfolioId: null }), member('3', 'Ana Gómez', { phone: '+573115550102', portfolioId: 'p2' }), member('4', 'Dueño', { roles: ['OWNER'] })];

  it('solo cobradores, activos primero y por nombre', () => {
    expect(collectorsOf(members).map((m) => m.id)).toEqual(['1', '2', '3']);
    expect(toCollectorRows(members, portfolios, 'all', '').map((row) => row.name)).toEqual(['Ana Gómez', 'Zoe Torres', 'Álvaro Díaz']);
  });

  it('filtra por estado y busca sin tildes ni mayúsculas, por nombre o celular', () => {
    expect(toCollectorRows(members, portfolios, 'inactive', '').map((row) => row.id)).toEqual(['2']);
    expect(toCollectorRows(members, portfolios, 'active', '').map((row) => row.id)).toEqual(['3', '1']);
    expect(toCollectorRows(members, portfolios, 'all', 'alvaro').map((row) => row.id)).toEqual(['2']);
    expect(toCollectorRows(members, portfolios, 'all', '311 555').map((row) => row.id)).toEqual(['3']);
    expect(toCollectorRows(members, portfolios, 'all', 'xyz')).toEqual([]);
  });

  it('arma la fila con iniciales, celular y cartera', () => {
    expect(toCollectorRows(members, portfolios, 'all', 'ana')[0]).toEqual({ id: '3', initials: 'AG', name: 'Ana Gómez', phone: '311 555 0102', portfolio: 'Norte', active: true });
    expect(toCollectorRows(members, portfolios, 'inactive', '')[0]?.portfolio).toBe('Sin cartera');
  });

  it('utilidades', () => {
    expect(displayPhone('+573001234567')).toBe('300 123 4567');
    expect(displayPhone('3001234567')).toBe('3001234567');
    expect(portfolioName(portfolios, 'p2')).toBe('Norte');
    expect(portfolioName(portfolios, null)).toBe('Sin cartera');
    expect(fold('ÁlvaRo')).toBe('alvaro');
  });
});

describe('desempeño de un cobrador', () => {
  const stats = { from: '2026-10-01', to: '2026-10-09', expectedAmount: 206000, collectedAmount: 140000, effectiveness: 0.68, visitsCount: 3, overdueAmount: 374000 };

  it('arma las cifras y los tonos', () => {
    const view = toCollectorStatsView(stats);
    expect(view.period).toBe('1 oct 2026 – 9 oct 2026');
    expect(view.cards.map((card) => [card.key, card.value, card.tone])).toEqual([
      ['collected', '$140.000', 'neutral'], ['expected', '$206.000', 'neutral'], ['effectiveness', '68 %', 'warning'], ['visits', '3', 'neutral'], ['overdue', '$374.000', 'bad'],
    ]);
  });

  it('efectividad baja, buena y sin dato', () => {
    expect(toCollectorStatsView({ ...stats, effectiveness: 0.5 }).cards[2]?.tone).toBe('bad');
    expect(toCollectorStatsView({ ...stats, effectiveness: 0.95, overdueAmount: 0 }).cards).toEqual(expect.arrayContaining([expect.objectContaining({ key: 'effectiveness', tone: 'good' }), expect.objectContaining({ key: 'overdue', tone: 'good' })]));
    expect(toCollectorStatsView({ ...stats, effectiveness: null }).cards[2]).toMatchObject({ value: '—', tone: 'neutral' });
  });
});

describe('mensajes de fallo', () => {
  const http = (status: number, code: string | null = null) => ({ kind: 'http', status, code, retryAfterSeconds: null }) as const;
  it.each([
    [{ kind: 'offline' }, /Sin conexión/], [{ kind: 'maintenance' }, /mantenimiento/], [http(403, 'FORBIDDEN'), /permiso/], [http(403, 'SUBSCRIPTION_READ_ONLY'), /solo lectura/],
    [http(404, 'NOT_FOUND'), /ya no existe/], [http(409, 'CONFLICT'), /ya trabaja/], [http(429), /Demasiados/], [http(500), /No pudimos/],
  ] as const)('%j', (failure, expected) => {
    expect(collectorFailureMessage(failure)).toMatch(expected);
  });

  it('los textos con nombre', () => {
    expect(COLLECTORS_COPY.registered.message('Ana')).toContain('Ana');
    expect(COLLECTORS_COPY.registered.shareMessage('Ana', '300', 'x1')).toContain('x1');
    expect(COLLECTORS_COPY.manage.resetMessage('Ana')).toContain('Ana');
    expect(COLLECTORS_COPY.manage.deactivateMessage('Ana')).toContain('Ana');
  });
});
