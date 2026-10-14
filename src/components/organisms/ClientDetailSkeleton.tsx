import { View } from 'react-native';
import { Skeleton } from '@/components/atoms/Skeleton';

const ROWS = [0, 1, 2, 3, 4, 5];
const HISTORY = [0, 1, 2];

/** Detalle de cliente "cargando": las mismas formas que `ClientDetailView`, en gris, para que nada salte al llegar los datos. */
export function ClientDetailSkeleton() {
  return (
    <View className="flex-1 px-6 pt-6" accessibilityLabel="Cargando cliente" accessibilityRole="progressbar">
      <View className="items-center gap-3 pb-5">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-[26px] w-[62px] rounded-full" />
      </View>
      <View className="overflow-hidden rounded-md bg-surface">
        {ROWS.map((key) => (
          <View key={key} className="h-11 flex-row items-center justify-between px-5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </View>
        ))}
      </View>
      <Skeleton className="mb-3 mt-6 h-4 w-36" />
      <View className="overflow-hidden rounded-md bg-surface">
        {HISTORY.map((key) => (
          <View key={key} className="h-[60px] flex-row items-center justify-between px-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
          </View>
        ))}
      </View>
    </View>
  );
}
