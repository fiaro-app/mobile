import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/molecules/EmptyState';
import { FilterBar } from '@/components/molecules/FilterBar';
import { TopBar } from '@/components/molecules/TopBar';
import { ClientList } from '@/components/organisms/ClientList';
import { OptionSheet } from '@/components/organisms/OptionSheet';
import { ScreenTemplate } from '@/components/templates/ScreenTemplate';
import { ROUTE_COPY } from '@/features/route/content/messages';
import { useClientsScreen } from '@/features/route/hooks/use-clients-screen';
import { useGoBack } from '@/features/workspace/hooks/use-go-back';

/** Ruta `/clients`: "Mis clientes", búsqueda y filtros sobre los clientes de la ruta. */
export default function ClientsScreen() {
  const router = useRouter();
  const goBack = useGoBack();
  const openClient = (row: { id: string; clientId: string }) => {
    router.push({ pathname: '/client/[loanId]', params: { loanId: row.id, clientId: row.clientId } });
  };
  const screen = useClientsScreen();
  const { filters, setSearch, setStatus, setRange } = screen.search;
  return (
    <ScreenTemplate
      topBar={
        <TopBar
          title={ROUTE_COPY.clientsTitle}
          onBack={() => {
            goBack();
          }}
        />
      }
    >
      <ClientList
        items={screen.rows.map((row) => ({ ...row, onPress: () => openClient(row) }))}
        loading={screen.loading}
        refreshing={screen.refreshing}
        onRefresh={screen.refresh}
        header={
          <FilterBar
            search={filters.search}
            searchPlaceholder={ROUTE_COPY.searchPlaceholder}
            onSearch={setSearch}
            statusOptions={ROUTE_COPY.statusOptions}
            status={filters.status}
            onStatus={setStatus}
            rangeLabel={screen.rangeLabel}
            rangeActive={filters.range !== 'any'}
            onOpenRange={screen.openRangeSheet}
          />
        }
        empty={<EmptyState {...screen.empty} onAction={screen.refresh} />}
      />
      <OptionSheet
        visible={screen.rangeSheetOpen}
        title={ROUTE_COPY.rangeTitle}
        options={ROUTE_COPY.rangeOptions}
        selected={filters.range}
        onSelect={setRange}
        onClose={screen.closeRangeSheet}
      />
    </ScreenTemplate>
  );
}
