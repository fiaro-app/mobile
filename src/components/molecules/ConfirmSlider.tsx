import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppText } from '@/components/atoms/AppText';
import { successHaptic } from '@/lib/haptics';

const HANDLE = 48;
const PADDING = 4;
const THRESHOLD = 0.85;

export interface ConfirmSliderProps {
  readonly label: string;
  readonly onConfirm: () => void;
  readonly disabled?: boolean;
}

/**
 * Deslizador de confirmación ("Desliza para confirmar el pago"): evita registrar un cobro con un toque
 * accidental. Hay que arrastrar la perilla más del 85 % del recorrido; si se suelta antes, vuelve sola al
 * inicio. Corre en el hilo de UI con Reanimated y Gesture Handler (fluido aunque el JS esté ocupado).
 * Para lectores de pantalla, donde arrastrar es difícil, expone la acción "activate" que confirma directo.
 */
export function ConfirmSlider({ label, onConfirm, disabled = false }: Readonly<ConfirmSliderProps>) {
  const [width, setWidth] = useState(0);
  const travel = Math.max(1, width - HANDLE - PADDING * 2);
  const offset = useSharedValue(0);

  const confirm = () => {
    successHaptic();
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && width > 0)
    .onUpdate((event) => {
      offset.value = Math.min(travel, Math.max(0, event.translationX));
    })
    .onEnd(() => {
      if (offset.value >= travel * THRESHOLD) {
        runOnJS(confirm)();
        offset.value = withSpring(0);
      } else {
        offset.value = withSpring(0);
      }
    });

  const handleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: offset.value + HANDLE + PADDING * 2 }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: interpolate(offset.value, [0, travel * 0.6], [1, 0], 'clamp') }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={() => {
        if (!disabled) confirm();
      }}
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
      className="h-14 justify-center overflow-hidden rounded-full bg-primary/15"
    >
      <Animated.View style={fillStyle} className="absolute inset-y-0 left-0 rounded-full bg-primary/25" />
      <Animated.View style={labelStyle} className="absolute inset-0 items-center justify-center">
        <AppText variant="body" tone="primary" className="font-sans-semibold text-[15px]">
          {label}
        </AppText>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={handleStyle} className="ml-1 size-12 items-center justify-center rounded-full bg-surface shadow-md shadow-foreground/20">
          <AppText variant="title" tone="primary" className="text-[22px]">
            ›
          </AppText>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
