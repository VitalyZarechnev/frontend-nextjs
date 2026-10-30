'use client';

import { SubmitHandler, UseFormReturn } from 'react-hook-form';

import { TPostForm } from '@features/post-management/hooks/usePostForm';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';
import Form from '@ui/molecules/form/Form';
import FormTextField from '@ui/molecules/form/FormTextField';

type TProps = {
  control: UseFormReturn<TPostForm>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: SubmitHandler<TPostForm>;
};

export default function PostFormFields(props: TProps) {
  const { control, isPending, submitLabel, onSubmit } = props;

  return (
    <Form<TPostForm> methods={control} onSubmit={onSubmit}>
      <Flex vertical gap={16}>
        <FormTextField id='title' name='title' label='Заголовок' placeholder='Заголовок' />
        <FormTextField id='body' name='body' label='Текст' placeholder='Текст' />
        <Button variant='main' type='submit' disabled={isPending} loading={isPending}>
          {submitLabel}
        </Button>
      </Flex>
    </Form>
  );
}
