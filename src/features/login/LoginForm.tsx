'use client';

import { TLoginForm, useLoginForm } from '@features/login/hooks/useLoginForm';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';
import Form from '@ui/molecules/form/Form';
import FormTextField from '@ui/molecules/form/FormTextField';

export default function LoginForm() {
  const { isPending, handleSubmit, control } = useLoginForm();

  return (
    <Flex vertical align='center' gap={16}>
      <Form<TLoginForm> onSubmit={handleSubmit} methods={control}>
        <Flex vertical gap={16}>
          <FormTextField name='email' type='email' label='Email' placeholder='Email' />
          <FormTextField name='password' type='password' label='Пароль' placeholder='Пароль' />
          <Button variant='main' type='submit' disabled={isPending} loading={isPending}>
            Войти
          </Button>
        </Flex>
      </Form>
    </Flex>
  );
}
