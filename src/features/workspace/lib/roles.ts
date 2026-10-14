import { z } from 'zod';

/** Roles de una membresía: Owner y Lender administran el negocio; Collector cobra en la calle. */
export const RoleSchema = z.enum(['OWNER', 'LENDER', 'COLLECTOR']);
export type Role = z.infer<typeof RoleSchema>;

/** Con qué cara se usa la app: la del administrador (web móvil) o la del cobrador (ruta del día). */
export type Mode = 'admin' | 'collector';

/** `true` si algún rol permite administrar (Owner o Lender). */
export function canAdminister(roles: readonly Role[]): boolean {
  return roles.includes('OWNER') || roles.includes('LENDER');
}

/** `true` si algún rol permite cobrar (Collector). */
export function canCollect(roles: readonly Role[]): boolean {
  return roles.includes('COLLECTOR');
}

/**
 * El modo con el que se abre la app: quien administra entra como administrador (aunque también cobre; puede
 * cambiar a "modo cobrador" desde el menú) y quien solo cobra, como cobrador.
 */
export function defaultMode(roles: readonly Role[]): Mode {
  return canAdminister(roles) ? 'admin' : 'collector';
}

/** Etiqueta del rol para mostrar junto al nombre ("Administrador" / "Cobrador"). */
export function roleLabel(roles: readonly Role[]): string {
  return canAdminister(roles) ? 'Administrador' : 'Cobrador';
}
