import { ScrollView, View } from 'react-native';
import { FilterPill } from '@/components/atoms/FilterPill';
import { SelectButton } from '@/components/atoms/SelectButton';

export interface RouteFilterBarProps<F extends string> {
  /** Pastillas ya con su conteo en la etiqueta (`Mora (3)`). */
  readonly filters: readonly { readonly value: F; readonly label: string }[];
  readonly filter: F;
  readonly onFilter: (value: F) => void;
  /** Texto del selector de orden (`Orden: Mayor deuda`). */
  readonly sortLabel: string;
  readonly sortActive: boolean;
  readonly onOpenSort: () => void;
}

/** Filtros de «Ruta de hoy»: pastillas que se desplazan de lado y el selector de orden. Solo dibuja. */
export function RouteFilterBar<F extends string>(props: Readonly<RouteFilterBarProps<F>>) {
  return (
    <View className="gap-3 bg-surface pb-4 pt-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
        {props.filters.map((option) => (
          <FilterPill
            key={option.value}
            label={option.label}
            active={option.value === props.filter}
            onPress={() => {
              props.onFilter(option.value);
            }}
          />
        ))}
      </ScrollView>
      <View className="px-5">
        <SelectButton label={props.sortLabel} active={props.sortActive} onPress={props.onOpenSort} />
      </View>
    </View>
  );
}
