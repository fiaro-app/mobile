import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente de TanStack Query para el server state. Sin reintentos automáticos por defecto: en campo,
 * reintentar solo gasta batería y datos; cada consulta decide si lo necesita. Se crea una vez
 * fuera de React para que sobreviva a los re-renders del árbol raíz.
 */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
