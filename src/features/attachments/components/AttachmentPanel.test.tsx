import { render, screen } from '@testing-library/react-native';
import { AttachmentPanel } from '@/features/attachments/components/AttachmentPanel';
import { useAttachment } from '@/features/attachments/hooks/use-attachment';

jest.mock('@/features/attachments/hooks/use-attachment', () => ({ useAttachment: jest.fn() }));
jest.mock('@/components/organisms/AttachmentSection', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { AttachmentSection: ({ title, url }: { title: string; url: string | null }) => <Text>{`${title}|${url ?? 'sin'}`}</Text> };
});

describe('AttachmentPanel', () => {
  it('feeds the section with what the hook returns', async () => {
    jest.mocked(useAttachment).mockReturnValue({ url: 'https://s/x', loading: false, loadFailed: false, busy: false, error: null, notice: null, confirmingRemove: false, choose: jest.fn(), askRemove: jest.fn(), cancelRemove: jest.fn(), confirmRemove: jest.fn(), reload: jest.fn() });

    await render(<AttachmentPanel target="client" id="c1" title="Foto" description="d" alt="a" none="n" canEdit />);

    expect(useAttachment).toHaveBeenCalledWith('client', 'c1');
    expect(screen.getByText('Foto|https://s/x')).toBeTruthy();
  });
});
