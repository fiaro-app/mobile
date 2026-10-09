import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { cn } from '@/lib/cn';

/**
 * Bloque gris que late mientras carga algo (reemplaza al contenido real para que la pantalla no
 * salte al llegar los datos). La animación corre en el hilo de UI.
 */
export function Skeleton({ className }: Readonly<{ className?: string }>) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.5, { duration: 700 })), -1);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className={cn('rounded-md bg-skeleton', className)} />;
}
