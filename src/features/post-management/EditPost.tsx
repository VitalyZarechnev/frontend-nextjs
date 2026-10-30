'use client';

import { TPost } from '@domain/posts/models/Post';

import { usePostForm } from '@features/post-management/hooks/usePostForm';
import PostFormFields from '@features/post-management/ui/PostFormFields';

import Flex from '@ui/atoms/flex/Flex';
import Heading from '@ui/atoms/typography/Heading';
import Modal from '@ui/molecules/modal/Modal';

type TProps = {
  post: TPost;
  open: boolean;
  onClose: () => void;
};

export default function EditPost(props: TProps) {
  const { post, open, onClose } = props;

  const { control, isPending, handleSubmit } = usePostForm({ mode: 'edit', post, onSuccess: onClose });

  return (
    <Modal open={open} onClose={onClose}>
      <Flex vertical gap={24}>
        <Heading variant='h3'>Редактировать пост</Heading>
        <PostFormFields control={control} isPending={isPending} submitLabel='Сохранить' onSubmit={handleSubmit} />
      </Flex>
    </Modal>
  );
}
