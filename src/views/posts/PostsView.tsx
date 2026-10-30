import PostsList from '@features/posts-list/PostsList';

import Flex from '@ui/atoms/flex/Flex';
import Heading from '@ui/atoms/typography/Heading';

import classes from './PostsView.module.scss';

export default function PostsView() {
  return (
    <main className={classes.posts_view}>
      <Flex vertical gap={24}>
        <Heading variant='h1'>Посты</Heading>
        <PostsList />
      </Flex>
    </main>
  );
}
