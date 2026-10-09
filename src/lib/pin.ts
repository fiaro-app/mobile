/**
 * Dígitos del PIN de desbloqueo (el diseño muestra 4 círculos). Vive en `lib` porque lo comparten
 * la regla de negocio (`pin-rules`) y el indicador visual (`PinDots`), y los componentes no pueden
 * importar de `features`.
 */
export const PIN_LENGTH = 4;
