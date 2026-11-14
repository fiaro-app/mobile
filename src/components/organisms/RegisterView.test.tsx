import { fireEvent, render, screen } from '@testing-library/react-native';
import { RegisterView, type RegisterViewProps } from '@/components/organisms/RegisterView';

jest.mock('@/components/atoms/Button', () => {
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Button: ({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) => (
      <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} accessibilityState={{ disabled: disabled === true }}>
        <Text>{label}</Text>
      </Pressable>
    ),
  };
});

/** Cada texto es su propia clave (`TEXTS.submit === 'submit'`): la prueba no depende de la redacción. */
const TEXTS = new Proxy({}, { get: (_target, key) => String(key) }) as RegisterViewProps['texts'];

const noop = jest.fn();
const ALL = { terms: true, privacy: true, responsibility: true, cookies: true, marketing: false };

function view(consents: RegisterViewProps['consents'], onSubmit = noop) {
  return (
    <RegisterView
      step="company"
      texts={TEXTS}
      values={{ fullName: '', nationalId: '', phone: '', contactEmail: '', password: '', businessName: '' }}
      errors={{}}
      formError={null}
      busy={false}
      consents={consents}
      consentErrors={[]}
      onConsent={noop}
      onOpenLegal={noop}
      onField={noop}
      onNext={noop}
      onBack={noop}
      onSubmit={onSubmit}
      onToLogin={noop}
      onCancel={noop}
    />
  );
}

describe('RegisterView — autorizaciones', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['terms', 'privacy', 'responsibility', 'cookies'] as const)('deshabilita «Crear cuenta» y avisa si falta %s', async (missing) => {
    const onSubmit = jest.fn();
    await render(view({ ...ALL, [missing]: false }, onSubmit));
    const button = screen.getByRole('button', { name: TEXTS.submit });
    expect(button).toBeDisabled();
    expect(screen.getByText(TEXTS.consentsPending)).toBeTruthy();
    await fireEvent.press(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('habilita el botón con las cuatro obligatorias, aunque las novedades estén sin marcar', async () => {
    const onSubmit = jest.fn();
    await render(view(ALL, onSubmit));
    const button = screen.getByRole('button', { name: TEXTS.submit });
    expect(button).toBeEnabled();
    expect(screen.queryByText(TEXTS.consentsPending)).toBeNull();
    await fireEvent.press(button);
    expect(onSubmit).toHaveBeenCalled();
  });
});
