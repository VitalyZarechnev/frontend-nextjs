'use client';

import { useRouter } from 'next/navigation';

import { registry } from '@application/di/AppRegistry';
import { routes } from '@application/routes';

import { PostNotFoundError } from '@domain/posts/errors/PostNotFoundError';

import DeletePost from '@features/post-management/DeletePost';
import EditPost from '@features/post-management/EditPost';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';
import Spinner from '@ui/atoms/spinner/Spinner';
import Content from '@ui/atoms/typography/Content';
import Heading from '@ui/atoms/typography/Heading';

import { createDatasource } from '@utils/datasource';
import { useFlag } from '@utils/state/useFlag';

const postsData = createDatasource(registry.postsDatasource);

type TProps = {
  id: string;
};

export default function PostDetail(props: TProps) {
  const { id } = props;

  const { replace } = useRouter();

  const { flag: isEditOpen, enable: openEdit, disable: closeEdit } = useFlag();
  const { flag: isDeleteOpen, enable: openDelete, disable: closeDelete } = useFlag();

  const { data: post, isPending, error, isSuccess } = postsData.useGetPostById([Number(id)]);

  const handleDeleted = () => {
    replace(routes.posts);
  };

  if (isPending) {
    return <Spinner />;
  }

  if (error instanceof PostNotFoundError) {
    return <Heading variant='h2'>Пост не найден</Heading>;
  }

  if (error || !isSuccess || !post) {
    return <h1>Error</h1>;
  }

  return (
    <Flex vertical gap={24}>
      <Heading variant='h1'>{post.title}</Heading>
      <Content>{post.body}</Content>
      <Flex gap={12}>
        <Button variant='secondary' onClick={openEdit}>
          Редактировать
        </Button>
        <Button variant='secondary' onClick={openDelete}>
          Удалить
        </Button>
      </Flex>
      <EditPost post={post} open={isEditOpen} onClose={closeEdit} />
      <DeletePost postId={post.id} open={isDeleteOpen} onClose={closeDelete} onDeleted={handleDeleted} />
    </Flex>
  );
}
