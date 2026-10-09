import * as LocalAuthentication from 'expo-local-authentication';

/**
 * `true` si el teléfono tiene huella o rostro configurados. Sin esto la tecla de huella del
 * teclado de PIN no se muestra.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

/**
 * Pide la huella o el rostro. `disableDeviceFallback` evita que el sistema ofrezca el PIN del
 * teléfono: la alternativa es el PIN de Fiaro, que la persona ya tiene a la vista. Devuelve
 * `false` si cancela o falla; nunca lanza.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Entra a tu ruta',
      cancelLabel: 'Usar PIN',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}
