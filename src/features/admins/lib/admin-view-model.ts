import type { BadgeKind } from '@/components/atoms/Badge';
import type { Member } from '@/features/team/lib/member-schemas';
import type { Role } from '@/features/workspace/lib/roles';

/** Qué se puede hacer con un administrador: quitarle el rol (sigue con otro) o quitarle el acceso (solo administraba). */
export type AdminAction = 'demote' | 'remove';

/** Una fila de la lista de administradores. */
export interface AdminRowModel {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly roleLabel: string;
  readonly badge: { readonly label: string; readonly kind: BadgeKind };
  readonly roles: readonly Role[];
  /** `null` para el dueño y para uno mismo: la API no lo permite. */
  readonly action: AdminAction | null;
}

/** Un colaborador al que se le puede subir de rango. */
export interface PromotableModel {
  readonly value: string;
  readonly label: string;
  readonly roles: readonly Role[];
}

function roleLabelOf(roles: readonly Role[]): string {
  if (roles.includes('OWNER')) return 'Dueño';
  return roles.includes('COLLECTOR') ? 'Administrador y cobrador' : 'Administrador';
}

/** Administradores activos (rol `LENDER`), con la acción que se les puede hacer. Al dueño y a uno mismo no se les ofrece ninguna. */
export function toAdminRows(members: readonly Member[], selfId: string | null): AdminRowModel[] {
  return members
    .filter((member) => member.status === 'ACTIVE' && member.roles.includes('LENDER'))
    .map((member) => {
      const actionable = !member.roles.includes('OWNER') && member.id !== selfId;
      const others = member.roles.filter((role) => role !== 'LENDER');
      let action: AdminAction | null = null;
      if (actionable) action = others.length > 0 ? 'demote' : 'remove';
      return {
        id: member.id,
        name: member.fullName,
        phone: member.phone,
        roleLabel: roleLabelOf(member.roles),
        badge: member.roles.includes('OWNER') ? { label: 'DUEÑO', kind: 'good' as const } : { label: 'ADMIN', kind: 'neutral' as const },
        roles: member.roles,
        action,
      };
    });
}

/** Colaboradores activos que todavía no administran (cobradores): a ellos se les puede subir de rango. */
export function toPromotable(members: readonly Member[]): PromotableModel[] {
  return members
    .filter((member) => member.status === 'ACTIVE' && !member.roles.includes('LENDER') && !member.roles.includes('OWNER'))
    .map((member) => ({ value: member.id, label: member.fullName, roles: member.roles }));
}
