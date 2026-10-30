import { fireEvent, render, screen } from '@testing-library/react';

import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  test('confirming calls onConfirm', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<ConfirmDialog open title='Delete post?' description='This cannot be undone.' onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('cancelling calls onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(<ConfirmDialog open title='Delete post?' description='This cannot be undone.' onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('renders custom confirm/cancel labels', () => {
    render(
      <ConfirmDialog
        open
        title='Delete post?'
        description='This cannot be undone.'
        confirmLabel='Delete'
        cancelLabel='Keep'
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  test('disables both buttons while isPending', () => {
    render(
      <ConfirmDialog open title='Delete post?' description='This cannot be undone.' isPending onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Подтвердить' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
  });
});
