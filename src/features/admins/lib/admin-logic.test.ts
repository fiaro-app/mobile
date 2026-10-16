import { AdminFormSchema, toInviteAdminBody } from '@/features/admins/lib/admin-schemas';
import { toAdminRows, toPromotable } from '@/features/admins/lib/admin-view-model';
import type { Member } from '@/features/team/lib/member-schemas';

const member = (over: Partial<Member>): Member => ({ id: 'm', userId: 'u', fullName: 'Luis Gómez', phone: '+573109998877', roles: ['COLLECTOR'], status: 'ACTIVE', portfolioId: null, ...over });
const OWNER = member({ id: 'owner', fullName: 'Marta Ríos', roles: ['OWNER', 'LENDER', 'COLLECTOR'] });
const ME = member({ id: 'me', fullName: 'Lucía Pardo', roles: ['LENDER'] });
const BOTH = member({ id: 'both', fullName: 'Pedro Gil', roles: ['LENDER', 'COLLECTOR'] });
const ONLY = member({ id: 'only', fullName: 'Ana Soto', roles: ['LENDER'] });
const COLLECTOR = member({ id: 'col', roles: ['COLLECTOR'] });

describe('toAdminRows', () => {
  it('muestra solo a los administradores activos con su rol', () => {
    const rows = toAdminRows([OWNER, ME, BOTH, COLLECTOR, member({ id: 'off', roles: ['LENDER'], status: 'INACTIVE' })], null);

    expect(rows.map((row) => [row.name, row.roleLabel, row.badge.label])).toEqual([
      ['Marta Ríos', 'Dueño', 'DUEÑO'],
      ['Lucía Pardo', 'Administrador', 'ADMIN'],
      ['Pedro Gil', 'Administrador y cobrador', 'ADMIN'],
    ]);
  });

  it('no ofrece acción sobre el dueño ni sobre uno mismo; a quien tiene otro rol se le quita el rol y a quien solo administra, el acceso', () => {
    const rows = toAdminRows([OWNER, ME, BOTH, ONLY], 'me');

    expect(rows.map((row) => row.action)).toEqual([null, null, 'demote', 'remove']);
  });
});

describe('toPromotable', () => {
  it('ofrece solo a los colaboradores activos que no administran', () => {
    expect(toPromotable([OWNER, ME, BOTH, COLLECTOR, member({ id: 'off', status: 'INACTIVE' })])).toEqual([{ value: 'col', label: 'Luis Gómez', roles: ['COLLECTOR'] }]);
  });
});

describe('AdminFormSchema', () => {
  const VALID = { fullName: 'Lucía Pardo', nationalId: '1.030.405.060', phone: '310 999 8877', contactEmail: 'lucia@correo.com' };

  it('acepta los datos de una persona sin cartera', () => {
    expect(AdminFormSchema.safeParse(VALID).success).toBe(true);
    expect(toInviteAdminBody(VALID).roles).toEqual(['LENDER']);
  });

  it('pide el correo y rechaza uno inválido', () => {
    expect(AdminFormSchema.safeParse({ ...VALID, contactEmail: '' }).success).toBe(false);
    expect(AdminFormSchema.safeParse({ ...VALID, contactEmail: 'no-es-correo' }).success).toBe(false);
  });
});
