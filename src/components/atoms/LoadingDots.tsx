import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

const DOT_DELAYS = [0, 150, 300] as const;

function Dot({ delay }: Readonly<{ delay: number }>) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })), -1),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className="size-1.5 rounded-full bg-primary-foreground" />;
}

/**
 * Tres puntos que laten, el estado "cargando" de los botones (el equivalente al `LoadingDots` de la
 * web). La animación corre en el hilo de UI con Reanimated, así no se traba si el JS está ocupado.
 */
export function LoadingDots() {
  return (
    <View className="flex-row items-center gap-1.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {DOT_DELAYS.map((delay) => (
        <Dot key={delay} delay={delay} />
      ))}
    </View>
  );
}
