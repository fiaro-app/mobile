import { useEffect, useState } from 'react';

/** Devuelve `value` con retraso: solo cambia cuando deja de cambiar por `delayMs`. Evita pedir al API en cada letra que se teclea. */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);
  return debounced;
}
