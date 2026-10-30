import z from 'zod';

export const UserModel = z.object({
  id: z.number().int().positive(),
  email: z.email(),
  phone: z.string(),
  username: z.string(),
  displayName: z.string(),
  isAdmin: z.boolean(),
});

export type TUser = z.infer<typeof UserModel>;
