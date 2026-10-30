import LoginForm from '@features/login/LoginForm';

import Flex from '@ui/atoms/flex/Flex';
import Heading from '@ui/atoms/typography/Heading';

import classes from './LoginView.module.scss';

export default function LoginView() {
  return (
    <main className={classes.login_view}>
      <Flex vertical align='center' gap={32}>
        <Heading variant='h1'>Вход</Heading>
        <LoginForm />
      </Flex>
    </main>
  );
}
