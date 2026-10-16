import { act, renderHook } from '@testing-library/react-native';
import { CONFIRM_COPY } from '@/lib/content/confirm-messages';
import { useConfirmedSubmit } from '@/lib/hooks/use-confirmed-submit';

describe('useConfirmedSubmit', () => {
  it('asks first and only submits when the person confirms', async () => {
    const submit = jest.fn();
    const { result } = await renderHook(() => useConfirmedSubmit(submit, CONFIRM_COPY.loan));
    expect(result.current.dialog.visible).toBe(false);

    await act(async () => {
      result.current.ask();
    });
    expect(result.current.dialog.visible).toBe(true);
    expect(submit).not.toHaveBeenCalled();

    await act(async () => {
      result.current.dialog.onConfirm();
    });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(result.current.dialog.visible).toBe(false);
  });

  it('closes without submitting when the person cancels', async () => {
    const submit = jest.fn();
    const { result } = await renderHook(() => useConfirmedSubmit(submit, CONFIRM_COPY.save));
    await act(async () => {
      result.current.ask();
    });
    await act(async () => {
      result.current.dialog.onCancel();
    });
    expect(result.current.dialog.visible).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });
});
