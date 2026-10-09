import { z } from 'zod';

/**
 * Respuesta de `GET /mobile/version`. Copia local del schema `MobileVersionResponseSchema` de
 * `@fiaro-app/contracts`: ese paquete es privado (GitHub Packages) y todavía no está instalado
 * en este repo. Cuando se instale, este archivo se reemplaza por el import del contrato.
 */
export const MobileVersionSchema = z.object({
  minimumSupportedVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  latestVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  downloadUrl: z.url(),
});
export type MobileVersion = z.infer<typeof MobileVersionSchema>;

/**
 * Compara dos versiones `MAYOR.MENOR.PARCHE`: negativo si `a` es anterior a `b`, 0 si son
 * iguales, positivo si es posterior. Copia de `compareAppVersions` del contrato.
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (partsA[index] ?? 0) - (partsB[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** `true` si la versión instalada está por debajo de la mínima que el API soporta. */
export function isUpdateRequired(installed: string, remote: MobileVersion): boolean {
  return compareVersions(installed, remote.minimumSupportedVersion) < 0;
}
