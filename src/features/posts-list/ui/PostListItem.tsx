'use client';

import Link from 'next/link';

import { routes } from '@application/routes';

import { TPost } from '@domain/posts/models/Post';

import DeletePost from '@features/post-management/DeletePost';
import EditPost from '@features/post-management/EditPost';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';

import { useFlag } from '@utils/state/useFlag';

type TProps = {
  post: TPost;
};

export default function PostListItem(props: TProps) {
  const { post } = props;

  const { flag: isEditOpen, enable: openEdit, disable: closeEdit } = useFlag();
  const { flag: isDeleteOpen, enable: openDelete, disable: closeDelete } = useFlag();

  return (
    <li>
      <Link href={routes.postDetail(post.id)}>
        <h4>{post.title}</h4>
      </Link>
      <p>{post.body}</p>
      <Flex gap={8}>
        <Button variant='secondary' onClick={openEdit}>
          Редактировать
        </Button>
        <Button variant='secondary' onClick={openDelete}>
          Удалить
        </Button>
      </Flex>
      <EditPost post={post} open={isEditOpen} onClose={closeEdit} />
      <DeletePost postId={post.id} open={isDeleteOpen} onClose={closeDelete} />
    </li>
  );
}
