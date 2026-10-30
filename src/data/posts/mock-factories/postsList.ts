import { PostModel, TPost } from '@domain/posts/models/Post';
import { TPostsList } from '@domain/posts/schemas/PostsList';

import { createSchemaFactory } from '@utils/testing/createSchemaFactory';

export const createPost = createSchemaFactory(PostModel);

export function createPostsList(count: number, overrides?: Partial<TPost>): TPostsList {
  return Array.from({ length: count }, (_, index) => createPost({ id: index + 1, ...overrides }));
}
