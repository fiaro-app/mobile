import { Linking } from 'react-native';

/**
 * Abre la app de teléfono con el número listo para marcar (`tel:`). No llama sola: el sistema pide
 * confirmación al cobrador. Devuelve `false` si el dispositivo no puede hacer llamadas (una tablet o un
 * simulador), para que la pantalla no falle en silencio.
 *
 * @param e164 - Celular en formato `+573001234567`.
 */
export async function callClient(e164: string): Promise<boolean> {
  try {
    await Linking.openURL(`tel:${e164}`);
    return true;
  } catch {
    return false;
  }
}
