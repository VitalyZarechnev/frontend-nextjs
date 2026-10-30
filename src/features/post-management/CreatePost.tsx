'use client';

import { usePostForm } from '@features/post-management/hooks/usePostForm';
import PostFormFields from '@features/post-management/ui/PostFormFields';

import Flex from '@ui/atoms/flex/Flex';
import Heading from '@ui/atoms/typography/Heading';
import Modal from '@ui/molecules/modal/Modal';

type TProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreatePost(props: TProps) {
  const { open, onClose } = props;

  const { control, isPending, handleSubmit } = usePostForm({ mode: 'create', onSuccess: onClose });

  return (
    <Modal open={open} onClose={onClose}>
      <Flex vertical gap={24}>
        <Heading variant='h3'>Новый пост</Heading>
        <PostFormFields control={control} isPending={isPending} submitLabel='Создать' onSubmit={handleSubmit} />
      </Flex>
    </Modal>
  );
}
