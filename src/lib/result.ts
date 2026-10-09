/**
 * Resultado de una operación que puede fallar de forma esperada. Los servicios lo devuelven en
 * lugar de lanzar excepciones, así el compilador obliga a quien los llama a decidir qué hacer con
 * cada fallo (mostrar un mensaje, reintentar) y las pantallas no necesitan `try/catch`.
 */
export type Result<T, F> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly failure: F };

/** Construye un resultado exitoso. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Construye un resultado fallido. */
export function fail<F>(failure: F): Result<never, F> {
  return { ok: false, failure };
}
