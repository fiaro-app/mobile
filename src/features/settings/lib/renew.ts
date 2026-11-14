import { Linking } from 'react-native';
import { SITE_URL } from '@/lib/config';

/**
 * Dónde se renueva o se cambia el plan: «Plan y pagos» de la web. La app no vende nada: pagar se hace
 * en el navegador (con Wompi), así no hay compras dentro de la app ni cobro de tiendas, y la dueña
 * paga desde la misma pantalla que ve en el computador. Si no tiene la sesión abierta en el
 * navegador, la web le pide iniciar sesión y la devuelve ahí.
 */
export const RENEW_URL = `${SITE_URL}/plan`;

/** Texto del botón o enlace que lleva a renovar. */
export const RENEW_LABEL = 'Renovar en la web';

/** Abre «Plan y pagos» de la web en el navegador. */
export function openRenewal(): void {
  void Linking.openURL(RENEW_URL);
}
