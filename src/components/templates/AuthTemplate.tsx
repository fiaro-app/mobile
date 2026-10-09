import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Esqueleto de las pantallas con formulario: fondo del diseño, margen de 24 px a los lados y
 * contenido que sube con el teclado. `keyboardShouldPersistTaps="handled"` deja tocar un botón con
 * el teclado abierto sin gastar el primer toque en cerrarlo; sin eso el cobrador tocaría "Iniciar
 * sesión" dos veces. No tiene lógica ni sabe qué formulario muestra.
 */
export function AuthTemplate({ children }: Readonly<{ children: ReactNode }>) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-6 gap-8"
        contentContainerStyle={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
