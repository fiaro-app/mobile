import type { CollectorStatsView } from '@/features/collectors/lib/collector-stats-view';

/** Diálogo abierto sobre la pantalla. */
export type ManageDialog = 'none' | 'reset' | 'deactivate' | 'portfolio' | 'destination' | 'reactivate' | 'remove';

/** Todo lo que la pantalla "Gestionar cobrador" dibuja y puede hacer. */
export interface CollectorManage {
  readonly loading: boolean;
  readonly notFound: boolean;
  readonly person: {
    readonly name: string;
    readonly phone: string;
    readonly active: boolean;
    readonly portfolio: string;
    readonly initials: string;
    /** El dueño del negocio: nunca se borra. */
    readonly isOwner: boolean;
    /** Es la propia persona: la API no deja administrarse a uno mismo (cartera, contraseña, baja). */
    readonly isSelf: boolean;
  } | null;
  readonly stats: CollectorStatsView | null;
  readonly statsFailed: boolean;
  readonly portfolioOptions: readonly { value: string; label: string }[];
  readonly portfolioId: string;
  /** Nombre de la cartera elegida (o la actual si no ha elegido otra). */
  readonly portfolioLabel: string;
  /** `true` si eligió una cartera distinta de la actual: aparece el botón de guardar. */
  readonly portfolioChanged: boolean;
  readonly dialog: ManageDialog;
  readonly busy: boolean;
  readonly error: string | null;
  readonly notice: string | null;
  readonly tempPassword: string | null;
  readonly openDialog: (dialog: Exclude<ManageDialog, 'none'>) => void;
  readonly closeDialog: () => void;
  readonly choosePortfolio: (portfolioId: string) => void;
  readonly savePortfolio: () => void;
  readonly confirmReset: () => void;
  readonly confirmDeactivate: () => void;
  /** A quién se le pueden pasar sus préstamos activos: los otros cobradores activos. */
  readonly destinationOptions: readonly { value: string; label: string }[];
  /** Cuántos préstamos activos tiene hoy (`null` mientras se revisan o si no se pudieron revisar). */
  readonly activeLoanCount: number | null;
  /** Da de baja pasando todos sus préstamos activos al cobrador elegido. */
  readonly chooseDestination: (collectorMembershipId: string) => void;
  readonly confirmReactivate: () => void;
  readonly confirmRemove: () => void;
  /** `true` cuando se borró: la pantalla vuelve a la lista. */
  readonly removed: boolean;
  readonly shareTempPassword: () => void;
  readonly dismissTempPassword: () => void;
}
