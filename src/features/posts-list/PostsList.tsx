'use client';

import { registry } from '@application/di/AppRegistry';

import PostListItem from '@features/posts-list/ui/PostListItem';

import Spinner from '@ui/atoms/spinner/Spinner';

import { createDatasource } from '@utils/datasource';

const postsData = createDatasource(registry.postsDatasource);

export default function PostsList() {
  const { data: posts, isPending, error, isSuccess } = postsData.useGetPosts();

  if (isPending) {
    return <Spinner />;
  }

  if (error || !isSuccess || !posts) {
    return <h1>Error</h1>;
  }

  return (
    <ul>
      {posts.map((post) => (
        <PostListItem key={post.id} post={post} />
      ))}
    </ul>
  );
}
