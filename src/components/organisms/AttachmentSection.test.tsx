import { render, screen, fireEvent } from '@testing-library/react-native';
import { AttachmentSection } from '@/components/organisms/AttachmentSection';

jest.mock('@/components/atoms/Button', () => {
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Button: ({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) => (
      <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

const labels = { loading: 'Cargando imagen…', loadFailed: 'No pudimos cargar la imagen.', retry: 'Reintentar', upload: 'Subir imagen', change: 'Cambiar imagen', remove: 'Quitar imagen', removeTitle: 't', removeMessage: 'm', cancel: 'Cancelar', confirmRemove: 'Quitar' };
const handlers = { onChoose: jest.fn(), onAskRemove: jest.fn(), onCancelRemove: jest.fn(), onConfirmRemove: jest.fn(), onReload: jest.fn() };
const base = { title: 'Foto', description: 'd', alt: 'Foto de Ana', none: 'Sin foto', canEdit: true, url: null, loading: false, loadFailed: false, busy: false, error: null, notice: null, confirmingRemove: false, labels, ...handlers };

describe('AttachmentSection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the loading state', async () => {
    await render(<AttachmentSection {...base} loading />);
    expect(screen.getByLabelText('Cargando imagen…')).toBeTruthy();
  });

  it('shows the error and retries', async () => {
    await render(<AttachmentSection {...base} loadFailed />);
    await fireEvent.press(screen.getByText('Reintentar'));
    expect(handlers.onReload).toHaveBeenCalled();
  });

  it('shows the empty state and uploads', async () => {
    await render(<AttachmentSection {...base} />);
    expect(screen.getByText('Sin foto')).toBeTruthy();
    await fireEvent.press(screen.getByText('Subir imagen'));
    expect(handlers.onChoose).toHaveBeenCalled();
    expect(screen.queryByText('Quitar imagen')).toBeNull();
  });

  it('shows the image, the notice and the error, and asks before removing', async () => {
    await render(<AttachmentSection {...base} url="https://s/x" notice="Imagen guardada." error="Falló" />);
    expect(screen.getByLabelText('Foto de Ana')).toBeTruthy();
    expect(screen.getByText('Imagen guardada.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Quitar imagen'));
    expect(handlers.onAskRemove).toHaveBeenCalled();
  });

  it('hides the buttons when it cannot edit', async () => {
    await render(<AttachmentSection {...base} url="https://s/x" canEdit={false} />);
    expect(screen.queryByText('Cambiar imagen')).toBeNull();
  });
});
