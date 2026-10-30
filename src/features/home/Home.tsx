'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { registry } from '@application/di/AppRegistry';
import { routes } from '@application/routes';
import { useSession } from '@application/SessionProvider';

import { LogoutCase } from '@domain/auth/usecases/LogoutCase';

import CreatePost from '@features/post-management/CreatePost';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';
import Heading from '@ui/atoms/typography/Heading';

import { useFlag } from '@utils/state/useFlag';
import { createUsecase } from '@utils/usecase';

const logoutCase = createUsecase(new LogoutCase(registry.authDatasource, registry.tokenManager, registry.profileStorage));

export default function Home() {
  const { replace } = useRouter();
  const profile = useSession();

  const { flag: isCreatePostOpen, enable: openCreatePost, disable: closeCreatePost } = useFlag();

  const { mutate: mutateLogout, isPending } = logoutCase.useMutation({
    onSuccess: () => replace(routes.login),
  });

  const handleLogout = () => {
    mutateLogout([]);
  };

  return (
    <div>
      <Flex vertical justify='center' align='center' gap={40}>
        <Heading variant='h2'>Здесь будет Homepage, {profile?.username}</Heading>
        <Button variant='main' onClick={openCreatePost}>
          Создать пост
        </Button>
        <Button variant='main' onClick={handleLogout} disabled={isPending} loading={isPending}>
          Логаут
        </Button>
        <Link href={routes.posts}>Открыть список постов</Link>
      </Flex>
      <CreatePost open={isCreatePostOpen} onClose={closeCreatePost} />
    </div>
  );
}
