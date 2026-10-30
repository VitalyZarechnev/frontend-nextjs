import z from 'zod';

import { PostModel } from '@domain/posts/models/Post';

export const PostsListSchema = z.array(PostModel);

export type TPostsList = z.infer<typeof PostsListSchema>;
