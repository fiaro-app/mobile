import { View } from 'react-native';
import { FilterPill } from '@/components/atoms/FilterPill';
import { SearchField } from '@/components/atoms/SearchField';
import type { FilterOption } from '@/components/molecules/FilterBar';

export interface ListHeaderProps<S extends string> {
  /** Sin buscador cuando no hay `search`. */
  readonly search?: { readonly value: string; readonly placeholder: string; readonly onChange: (text: string) => void };
  readonly filters?: { readonly options: readonly FilterOption<S>[]; readonly value: S; readonly onChange: (value: S) => void };
}

/** Cabecera de las listas del administrador: buscador y/o pastillas de filtro (sobre fondo blanco, como `FilterBar`). */
export function ListHeader<S extends string>({ search, filters }: Readonly<ListHeaderProps<S>>) {
  return (
    <View className="gap-3 bg-surface px-5 pb-4 pt-4">
      {search ? <SearchField value={search.value} onChangeText={search.onChange} placeholder={search.placeholder} /> : null}
      {filters ? (
        <View className="flex-row flex-wrap gap-2">
          {filters.options.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              active={option.value === filters.value}
              onPress={() => {
                filters.onChange(option.value);
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
