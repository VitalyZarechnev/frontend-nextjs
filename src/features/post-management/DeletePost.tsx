'use client';

import { registry } from '@application/di/AppRegistry';

import { DeletePostCase } from '@domain/posts/usecases/DeletePostCase';

import ConfirmDialog from '@ui/molecules/confirm-dialog/ConfirmDialog';

import { createUsecase } from '@utils/usecase';

const deletePostCase = createUsecase(new DeletePostCase(registry.postsDatasource));

type TProps = {
  postId: number;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
};

export default function DeletePost(props: TProps) {
  const { postId, open, onClose, onDeleted } = props;

  const { mutate: deletePost, isPending } = deletePostCase.useMutation();

  const handleConfirm = () => {
    deletePost([postId], {
      onSuccess: () => {
        onClose();
        onDeleted?.();
      },
    });
  };

  return (
    <ConfirmDialog
      open={open}
      title='Удалить пост?'
      description='Это действие нельзя отменить.'
      confirmLabel='Удалить'
      isPending={isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
