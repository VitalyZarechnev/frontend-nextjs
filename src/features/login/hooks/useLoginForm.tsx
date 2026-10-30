import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { registry } from '@application/di/AppRegistry';
import { routes } from '@application/routes';

import { LoginCase } from '@domain/auth/usecases/LoginCase';

import { createUsecase } from '@utils/usecase';

const loginCase = createUsecase(
  new LoginCase(registry.authDatasource, registry.usersDatasource, registry.tokenManager, registry.profileStorage),
);

const schema = z.object({
  email: z.string().min(1, 'Введите адрес').email('Неверный формат').max(100),
  password: z.string().trim().min(1, 'Введите пароль').max(100),
});

export type TLoginForm = z.input<typeof schema>;

export function useLoginForm() {
  const { replace } = useRouter();

  const { mutate: mutateLogin, isPending } = loginCase.useMutation();

  const control = useForm<TLoginForm>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(schema),
  });

  const handleSubmit = async ({ email, password }: TLoginForm): Promise<void> => {
    mutateLogin([email, password], {
      onSuccess: () => {
        replace(routes.home);
      },
    });
  };

  return {
    isPending,
    handleSubmit,
    control,
  };
}
