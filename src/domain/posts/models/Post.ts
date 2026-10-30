import z from 'zod';

export const PostModel = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

export type TPost = z.infer<typeof PostModel>;
