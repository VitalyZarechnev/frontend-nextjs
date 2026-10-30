'use client';

import { useEffect } from 'react';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';
import Heading from '@ui/atoms/typography/Heading';

type TProps = {
  error: Error;
  reset: () => void;
};

export default function Error(props: TProps) {
  const { error, reset } = props;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <Flex vertical justify='center' align='flex-start' gap={16}>
        <Heading variant='h2'>Упс... что-то пошло не так.</Heading>
        <Button variant='main' onClick={reset}>
          Обновить
        </Button>
      </Flex>
    </div>
  );
}
