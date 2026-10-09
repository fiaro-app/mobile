import { View } from 'react-native';
import { FilterPill } from '@/components/atoms/FilterPill';
import { SearchField } from '@/components/atoms/SearchField';
import { SelectButton } from '@/components/atoms/SelectButton';

export interface FilterOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface FilterBarProps<S extends string> {
  readonly search: string;
  readonly searchPlaceholder: string;
  readonly onSearch: (text: string) => void;
  readonly statusOptions: readonly FilterOption<S>[];
  readonly status: S;
  readonly onStatus: (value: S) => void;
  /** Texto del selector de rango (el elegido, o el nombre del filtro si no hay ninguno). */
  readonly rangeLabel: string;
  readonly rangeActive: boolean;
  readonly onOpenRange: () => void;
}

/**
 * Barra de filtros de "Mis clientes": búsqueda, pastillas de estado y un selector de rango. Es
 * genérica en el tipo de las pastillas (`S`) para no conocer los estados del dominio. El selector
 * solo avisa que se tocó: quien lo usa abre la lista de opciones.
 */
export function FilterBar<S extends string>(props: Readonly<FilterBarProps<S>>) {
  return (
    <View className="gap-3 bg-surface px-5 pb-4 pt-5">
      <SearchField value={props.search} onChangeText={props.onSearch} placeholder={props.searchPlaceholder} />
      <View className="flex-row gap-2">
        {props.statusOptions.map((option) => (
          <FilterPill
            key={option.value}
            label={option.label}
            active={option.value === props.status}
            onPress={() => {
              props.onStatus(option.value);
            }}
          />
        ))}
      </View>
      <SelectButton label={props.rangeLabel} active={props.rangeActive} onPress={props.onOpenRange} />
    </View>
  );
}
