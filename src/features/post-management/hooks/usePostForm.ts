import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { registry } from '@application/di/AppRegistry';

import { TPost } from '@domain/posts/models/Post';
import { CreatePostCase } from '@domain/posts/usecases/CreatePostCase';
import { UpdatePostCase } from '@domain/posts/usecases/UpdatePostCase';

import { createUsecase } from '@utils/usecase';

const createPostCase = createUsecase(new CreatePostCase(registry.postsDatasource));
const updatePostCase = createUsecase(new UpdatePostCase(registry.postsDatasource));

const schema = z.object({
  title: z.string().trim().min(1, 'Введите заголовок').max(100),
  body: z.string().trim().min(1, 'Введите текст').max(1000),
});

export type TPostForm = z.input<typeof schema>;

type TParams = {
  mode: 'create' | 'edit';
  post?: TPost;
  onSuccess?: () => void;
};

export function usePostForm(params: TParams) {
  const { mode, post, onSuccess } = params;

  const { mutate: createPost, isPending: isCreating } = createPostCase.useMutation();
  const { mutate: updatePost, isPending: isUpdating } = updatePostCase.useMutation();

  const control = useForm<TPostForm>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: post?.title ?? '',
      body: post?.body ?? '',
    },
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (values: TPostForm): Promise<void> => {
    const mutationOptions = {
      onSuccess: () => {
        control.reset();
        onSuccess?.();
      },
    };

    if (mode === 'edit' && post) {
      updatePost([post.id, values.title, values.body], mutationOptions);
      return;
    }

    createPost([values.title, values.body], mutationOptions);
  };

  return {
    control,
    isPending: isCreating || isUpdating,
    handleSubmit,
  };
}
